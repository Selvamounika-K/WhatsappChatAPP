import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "./MessageList.css";

function MessageList({ messages, currentUserId }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list-empty">
        <p>No messages yet</p>
        <p className="empty-hint">Start the conversation</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => {
        const senderId = msg.senderId?._id || msg.senderId;
        const userId = currentUserId?._id || currentUserId || currentUserId?.id;
        const isSent = senderId === userId;

        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            isSent={isSent}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
