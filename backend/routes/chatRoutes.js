const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { authenticate } = require("../middleware/auth");

// Create or get existing chat between two users
router.post("/", authenticate, async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user._id;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    if (participantId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, participantId] }
    }).populate("participants", "name phoneNumber isOnline lastSeen")
      .populate("lastMessage");

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [currentUserId, participantId],
        isGroup: false
      });
      
      chat = await Chat.findById(chat._id)
        .populate("participants", "name phoneNumber isOnline lastSeen")
        .populate("lastMessage");
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("Chat creation error:", err);
    res.status(500).json({ message: "Failed to create/get chat" });
  }
});

// Get all chats for current user
router.get("/", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const chats = await Chat.find({
      participants: currentUserId
    })
      .populate("participants", "name phoneNumber isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// Get specific chat by ID
router.get("/:chatId", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: currentUserId
    })
      .populate("participants", "name phoneNumber isOnline lastSeen")
      .populate("lastMessage");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("Get chat error:", err);
    res.status(500).json({ message: "Failed to fetch chat" });
  }
});

module.exports = router;
