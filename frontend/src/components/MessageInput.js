import { useState, useRef, useEffect } from "react";
import "./MessageInput.css";

function MessageInput({ onSend }) {
  const [content, setContent] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSend(content.trim());
      setContent("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="message-input"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageInput;

