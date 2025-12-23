import { useEffect, useRef } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "./ChatWindow.css";

function ChatWindow() {
  const { selectedChat, messages, sendMessage, markMessagesAsRead } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedChat && messages[selectedChat._id]) {
      markMessagesAsRead(selectedChat._id);
    }
  }, [selectedChat, messages, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherParticipant = () => {
    if (!selectedChat?.participants) return null;
    const userId = user?._id || user?.id;
    return selectedChat.participants.find(
      (p) => (p._id || p) !== userId
    );
  };

  const otherParticipant = getOtherParticipant();

  if (!selectedChat) {
    return null;
  }

  const handleSendMessage = (content) => {
    if (!content.trim()) return;
    const receiverId = otherParticipant?._id || otherParticipant;
    sendMessage(selectedChat._id, receiverId, content);
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="header-user-info">
          <div className="header-avatar">
            {otherParticipant?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="header-details">
            <div className="header-name">
              {otherParticipant?.name || "Unknown User"}
            </div>
            <div className="header-status">
              {otherParticipant?.isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </div>

      <MessageList
        messages={messages[selectedChat._id] || []}
        currentUserId={user?._id || user?.id}
      />

      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}

export default ChatWindow;

