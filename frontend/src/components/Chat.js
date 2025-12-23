import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import ContactList from "./ContactList";
import "./Chat.css";

function Chat() {
  const { user, logout, isAuthenticated } = useAuth();
  const { chats, contacts, selectedChat } = useChat();
  const [showContacts, setShowContacts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || "User"}</div>
              <div className="user-status">Online</div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => setShowContacts(!showContacts)}
              title="New Chat"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
            <button className="icon-button" onClick={logout} title="Logout">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
            </button>
          </div>
        </div>

        {showContacts ? (
          <ContactList onClose={() => setShowContacts(false)} />
        ) : (
          <ChatList />
        )}
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <ChatWindow />
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="#128c7e" opacity="0.3">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <h2>Select a chat to start messaging</h2>
              <p>Your messages will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
