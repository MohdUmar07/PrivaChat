const express = require("express");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Socket.IO handling
// Socket.IO handling
const onlineUsers = new Map(); // username -> socketId

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("join", (username) => {
    socket.join(username);
    onlineUsers.set(username, socket.id);
    console.log(`${username} joined. Online: ${onlineUsers.size}`);

    // Broadcast online users
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("typing", ({ to, from }) => {
    io.to(to).emit("typing", { from });
  });

  socket.on("stopTyping", ({ to, from }) => {
    io.to(to).emit("stopTyping", { from });
  });

  socket.on("sendMessage", async (message, toUser) => {
    try {
      const newMessage = new Message({
        sender: message.from,
        recipient: toUser,
        encryptedData: message.encryptedData,
        iv: message.iv,
        encryptedKey: message.encryptedKey,
        senderEncryptedKey: message.senderEncryptedKey,
      });
      await newMessage.save();
    } catch (err) {
      console.error("Error saving message:", err);
    }

    // Emit message to the specific user (or room)
    io.to(toUser).emit("receiveMessage", message);
    console.log(`Message sent to ${toUser}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // Find username by socketId and remove
    for (const [username, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(username);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
