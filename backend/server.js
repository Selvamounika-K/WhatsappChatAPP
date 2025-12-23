const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Apply CORS to all routes
app.use(cors(corsOptions));
// Handle preflight OPTIONS requests
app.options("*", cors(corsOptions));

app.use(express.json());

// Socket.IO configuration
const io = socketIo(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"]
});

// Initialize socket handlers
require("./socket")(io);

// Connect to database
connectDB();

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/chats", require("./routes/chatRoutes"));
app.use("/api", require("./routes/userRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
