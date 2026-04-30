const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

// ================= ROUTES =================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const itemRoutes = require("./routes/itemRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const server = http.createServer(app);


// ================= CORS CONFIG =================
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  "https://find-it-puce.vercel.app/"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps / postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

app.use(express.json());


// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});


// 🔥 Store online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("sendMessage", (data) => {
    const receiverSocket = onlineUsers.get(data.receiverId);

    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", data);
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.conversationId).emit("typing", data);
  });

  socket.on("stopTyping", (data) => {
    socket.to(data.conversationId).emit("stopTyping", data);
  });

  socket.on("getOnlineUsers", () => {
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});


// ================= STATIC =================
app.use("/uploads", express.static("uploads"));


// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);


// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("🚀 Backend Running");
});


// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Server Error"
  });
});


// ================= DB =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 MongoDB Atlas Connected");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

connectDB();


// ================= SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});