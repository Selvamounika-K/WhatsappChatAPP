const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { authenticate } = require("../middleware/auth");

// Get messages for a specific chat
router.get("/:chatId", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user._id;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: currentUserId
    });

    if (!chat) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ chatId })
      .populate("senderId", "name phoneNumber")
      .populate("receiverId", "name phoneNumber")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Create message (fallback REST endpoint)
router.post("/", authenticate, async (req, res) => {
  try {
    const { chatId, receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!chatId || !receiverId || !content) {
      return res.status(400).json({ message: "chatId, receiverId, and content are required" });
    }

    // Verify chat exists and user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
      return res.status(403).json({ message: "Chat not found or access denied" });
    }

    // Create message
    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      status: "SENT"
    });

    // Update chat's lastMessage and updatedAt
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name phoneNumber")
      .populate("receiverId", "name phoneNumber");

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Create message error:", err);
    res.status(500).json({ message: "Failed to create message" });
  }
});

module.exports = router;
