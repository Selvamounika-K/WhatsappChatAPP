import { createContext, useContext, useState, useEffect, useRef } from "react";
import API from "../services/api";
import { initializeSocket, getSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocketConnection();
      fetchChats();
      fetchContacts();
    }

    return () => {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const initializeSocketConnection = () => {
    const socket = initializeSocket();
    if (!socket) return;

    socketRef.current = socket;

    socket.on("receiveMessage", (message) => {
      handleReceiveMessage(message);
    });

    socket.on("messageDelivered", ({ messageId, chatId }) => {
      updateMessageStatus(chatId, messageId, "DELIVERED");
    });

    socket.on("messageRead", ({ messageId, chatId }) => {
      updateMessageStatus(chatId, messageId, "READ");
    });

    socket.on("userOnline", ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
  };

  const fetchChats = async () => {
    try {
      const response = await API.get("/chats");
      setChats(response.data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await API.get("/api/users/contacts");
      setContacts(response.data);
      
      // Initialize online users set
      const onlineSet = new Set(
        response.data.filter((u) => u.isOnline).map((u) => u._id)
      );
      setOnlineUsers(onlineSet);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const createOrGetChat = async (participantId) => {
    try {
      const response = await API.post("/chats", { participantId });
      const chat = response.data;

      // Add to chats if not already present
      setChats((prev) => {
        const exists = prev.find((c) => c._id === chat._id);
        if (exists) return prev;
        return [chat, ...prev];
      });

      return chat;
    } catch (error) {
      console.error("Failed to create/get chat:", error);
      throw error;
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    
    // Always fetch messages to ensure we have the latest chat history
    await fetchMessages(chat._id);

    // Mark messages as read after messages are loaded
    setTimeout(() => {
      markMessagesAsRead(chat._id);
    }, 300);
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await API.get(`/api/messages/${chatId}`);
      const fetchedMessages = response.data || [];
      
      // Sort messages by createdAt timestamp
      const sortedMessages = fetchedMessages.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateA - dateB;
      });
      
      setMessages((prev) => ({
        ...prev,
        [chatId]: sortedMessages
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async (chatId, receiverId, content) => {
    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      return;
    }

    socket.emit("sendMessage", { chatId, receiverId, content });
  };

  const handleReceiveMessage = (message) => {
    const { chatId } = message;
    const messageId = message._id?.toString() || message._id;

    // Update messages - avoid duplicates
    setMessages((prev) => {
      const existingMessages = prev[chatId] || [];
      const existingIds = new Set(existingMessages.map(m => (m._id?.toString() || m._id)));
      
      // Only add if message doesn't already exist
      if (!existingIds.has(messageId)) {
        return {
          ...prev,
          [chatId]: [...existingMessages, message].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateA - dateB;
          })
        };
      }
      
      return prev;
    });

    // Update chat's lastMessage
    setChats((prev) =>
      prev.map((chat) =>
        chat._id === chatId
          ? { ...chat, lastMessage: message, updatedAt: new Date() }
          : chat
      )
    );

    // If this is the selected chat, mark as read
    const receiverId = message.receiverId?._id || message.receiverId;
    const userId = user?._id || user?.id;
    if (selectedChat?._id === chatId && receiverId === userId) {
      markMessageAsRead(message._id, chatId);
    }
  };

  const markMessageAsRead = (messageId, chatId) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("messageRead", { messageId, chatId });
    }
  };

  const markMessagesAsRead = (chatId) => {
    // Access current messages state
    setMessages((prev) => {
      const chatMessages = prev[chatId] || [];
      const userId = user?._id || user?.id;
      
      // Mark unread messages as read
      chatMessages.forEach((msg) => {
        const receiverId = msg.receiverId?._id || msg.receiverId;
        if (receiverId === userId && msg.status !== "READ") {
          // Emit to socket to mark as read
          const socket = getSocket();
          if (socket) {
            socket.emit("messageRead", { messageId: msg._id, chatId });
          }
        }
      });
      
      return prev;
    });
  };

  const updateMessageStatus = (chatId, messageId, status) => {
    setMessages((prev) => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg
        )
      };
    });
  };

  const value = {
    chats,
    contacts,
    selectedChat,
    messages,
    onlineUsers,
    createOrGetChat,
    selectChat,
    sendMessage,
    fetchChats,
    fetchContacts,
    markMessagesAsRead
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

