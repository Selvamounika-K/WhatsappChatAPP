import { useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import "./ChatList.css";

function ChatList() {
  const { chats, selectChat, onlineUsers } = useChat();
  const { user } = useAuth();

  const getOtherParticipant = (chat) => {
    // For one-to-one chats, get the other participant
    if (chat.participants && chat.participants.length === 2) {
      return chat.participants.find(
        (p) => (p._id || p) !== (user?._id || user?.id)
      );
    }
    return null;
  };

  const formatTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return messageDate.toLocaleDateString([], { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return "No messages yet";
    if (typeof chat.lastMessage === "object") {
      return chat.lastMessage.content || "No messages yet";
    }
    return "No messages yet";
  };

  return (
    <div className="chat-list">
      {chats.length === 0 ? (
        <div className="empty-chat-list">
          <p>No chats yet</p>
          <p className="empty-hint">Start a new conversation</p>
        </div>
      ) : (
        chats.map((chat) => {
          const otherParticipant = getOtherParticipant(chat);
          const participantId = otherParticipant?._id || otherParticipant;
          const isOnline = participantId && onlineUsers.has(participantId);

          return (
            <div
              key={chat._id}
              className="chat-item"
              onClick={() => selectChat(chat)}
            >
              <div className="chat-avatar">
                {otherParticipant?.name?.charAt(0).toUpperCase() || "U"}
                {isOnline && <span className="online-indicator"></span>}
              </div>
              <div className="chat-info">
                <div className="chat-header-row">
                  <div className="chat-name">
                    {otherParticipant?.name || otherParticipant?.phoneNumber || "Unknown User"}
                  </div>
                  <div className="chat-time">
                    {formatTime(chat.updatedAt)}
                  </div>
                </div>
                <div className="chat-preview">
                  {getLastMessagePreview(chat)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default ChatList;

