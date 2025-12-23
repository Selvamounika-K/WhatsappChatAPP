import { useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import "./ContactList.css";

function ContactList({ onClose }) {
  const { contacts, createOrGetChat, selectChat, onlineUsers } = useChat();

  const handleContactClick = async (contact) => {
    try {
      const chat = await createOrGetChat(contact._id);
      selectChat(chat);
      onClose();
    } catch (error) {
      console.error("Failed to create/get chat:", error);
    }
  };

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <h3>New Chat</h3>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="contacts">
        {contacts.length === 0 ? (
          <div className="empty-contacts">
            <p>No contacts available</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const isOnline = onlineUsers.has(contact._id);

            return (
              <div
                key={contact._id}
                className="contact-item"
                onClick={() => handleContactClick(contact)}
              >
                <div className="contact-avatar">
                  {contact.name?.charAt(0).toUpperCase() || "U"}
                  {isOnline && <span className="online-indicator"></span>}
                </div>
                <div className="contact-info">
                  <div className="contact-name">{contact.name || contact.phoneNumber}</div>
                  <div className="contact-status">
                    {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ContactList;

