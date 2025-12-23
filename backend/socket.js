const Message = require("./models/Message");
const Chat = require("./models/Chat");
const User = require("./models/User");
const { authenticateSocket } = require("./middleware/auth");

// Map to store userId -> socketId mapping
const onlineUsers = new Map();

module.exports = (io) => {
  // Apply authentication middleware to socket connections
  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId} (socket: ${socket.id})`);

    // User joins their own room
    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Deliver pending messages (messages sent while user was offline)
    const pendingMessages = await Message.find({
      receiverId: userId,
      status: "SENT"
    })
      .populate("senderId", "name phoneNumber")
      .populate("receiverId", "name phoneNumber")
      .sort({ createdAt: 1 });

    for (const msg of pendingMessages) {
      msg.status = "DELIVERED";
      await msg.save();

      socket.emit("receiveMessage", {
        ...msg.toObject(),
        status: "DELIVERED"
      });

      // Notify sender of delivery
      const senderSocketId = onlineUsers.get(msg.senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: msg._id,
          chatId: msg.chatId
        });
      }
    }

    // Notify others that this user is online
    socket.broadcast.emit("userOnline", { userId });

    // Handle join event (for backward compatibility)
    socket.on("join", (data) => {
      console.log(`User ${userId} joined`);
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, receiverId, content } = data;

        if (!chatId || !receiverId || !content) {
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        // Verify chat exists and user is participant
        const chat = await Chat.findOne({
          _id: chatId,
          participants: { $all: [userId, receiverId] }
        });

        if (!chat) {
          socket.emit("error", { message: "Chat not found or access denied" });
          return;
        }

        // Create message with SENT status
        const message = await Message.create({
          chatId,
          senderId: userId,
          receiverId,
          content,
          status: "SENT"
        });

        // Update chat's lastMessage and updatedAt
        chat.lastMessage = message._id;
        chat.updatedAt = new Date();
        await chat.save();

        // Populate message data
        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name phoneNumber")
          .populate("receiverId", "name phoneNumber");

        // Check if receiver is online
        const receiverSocketId = onlineUsers.get(receiverId);
        const isReceiverOnline = !!receiverSocketId;

        // Emit to sender (confirmation)
        socket.emit("receiveMessage", populatedMessage);

        if (isReceiverOnline) {
          // Receiver is online - deliver immediately
          message.status = "DELIVERED";
          await message.save();

          // Emit to receiver
          io.to(receiverSocketId).emit("receiveMessage", {
            ...populatedMessage.toObject(),
            status: "DELIVERED"
          });

          // Notify sender of delivery
          socket.emit("messageDelivered", {
            messageId: message._id,
            chatId
          });
        } else {
          // Receiver is offline - message stays as SENT
          // Will be delivered when receiver comes online
        }
      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle message read receipt
    socket.on("messageRead", async (data) => {
      try {
        const { messageId, chatId } = data;

        if (!messageId || !chatId) {
          socket.emit("error", { message: "messageId and chatId are required" });
          return;
        }

        // Find message and verify it belongs to this user
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Verify chat belongs to user
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId
        });

        if (!chat) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Only mark as READ if user is the receiver
        if (message.receiverId.toString() === userId && message.status !== "READ") {
          message.status = "READ";
          await message.save();

          // Notify sender
          const senderSocketId = onlineUsers.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("messageRead", {
              messageId: message._id,
              chatId
            });
          }
        }
      } catch (err) {
        console.error("Message read error:", err);
        socket.emit("error", { message: "Failed to mark message as read" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId} (socket: ${socket.id})`);

      // Remove from online users
      onlineUsers.delete(userId);

      // Update user offline status
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // Notify others that this user is offline
      socket.broadcast.emit("userOffline", { userId });
    });
  });
};
