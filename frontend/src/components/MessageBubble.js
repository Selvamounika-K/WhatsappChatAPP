import React from "react";
import "./MessageBubble.css";

function MessageBubble({ message, isSent }) {
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusIcon = (status) => {
    if (status === "READ") {
      return (
        <span className="status-icon read">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854 2.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8 9.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            <path d="M10.854 2.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L3.5 9.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </span>
      );
    } else if (status === "DELIVERED") {
      return (
        <span className="status-icon delivered">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854 2.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8 9.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </span>
      );
    } else {
      return (
        <span className="status-icon sent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854 2.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8 9.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </span>
      );
    }
  };

  return (
    <div className={`message-bubble-wrapper ${isSent ? "sent" : "received"}`}>
      <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
        <div className="message-content">{message.content}</div>
        <div className="message-footer">
          <span className="message-time">
            {formatTime(message.createdAt || message.timestamp)}
          </span>
          {isSent && (
            <span className="message-status">
              {getStatusIcon(message.status || "SENT")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;

