const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    lastMessage: {
      text: String,
      sender: mongoose.Schema.Types.ObjectId,
      createdAt: Date
    }
  },
  { timestamps: true }
);

// 🔥 helps performance
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);