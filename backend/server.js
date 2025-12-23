const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://whatsappchatapplication.vercel.app"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Apply CORS for all routes
app.use(cors(corsOptions));
app.use(express.json());

// Note: cors middleware above will handle preflight automatically; no extra app.options needed

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
