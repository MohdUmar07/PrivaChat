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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Socket.IO handling
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("join", (username) => {
    socket.join(username); // Join a room with the user's username
    console.log(`${username} joined the chat room`);
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
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
