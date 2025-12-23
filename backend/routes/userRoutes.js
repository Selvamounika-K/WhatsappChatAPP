const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// Get current user profile
router.get("/users/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Get all contacts (users except current user)
router.get("/users/contacts", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      "name phoneNumber isOnline lastSeen"
    ).sort({ name: 1 });

    res.status(200).json(users);
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

module.exports = router;
