const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");


// ================= CREATE OR GET CONVERSATION =================
router.post("/conversation", auth, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver required" });
    }

    let convo = await Conversation.findOne({
      members: { $all: [req.userId, receiverId] }
    });

    if (!convo) {
      convo = await Conversation.create({
        members: [req.userId, receiverId]
      });
    }

    res.json(convo);

  } catch (err) {
    console.error("CREATE CONVO ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET CONVERSATIONS =================
router.get("/conversation", auth, async (req, res) => {
  try {
    const convos = await Conversation.find({
      members: req.userId
    })
      .populate("members", "firstName lastName")
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = await Promise.all(
      convos.map(async (c) => {

        // ✅ CORRECT unread logic
        const unread = await Message.countDocuments({
          conversationId: c._id,
          sender: { $ne: req.userId },
          readBy: { $nin: [req.userId] }
        });

        return {
          ...c,
          unreadCount: unread
        };
      })
    );

    res.json(enriched);

  } catch (err) {
    console.error("GET CONVO ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET MESSAGES =================
router.get("/message/:id", auth, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const msgs = await Message.find({
      conversationId
    }).sort({ createdAt: 1 });

    // ✅ FIXED READ LOGIC
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.userId }
      },
      {
        $addToSet: { readBy: req.userId }
      }
    );

    res.json(msgs);

  } catch (err) {
    console.error("GET MSG ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= SEND MESSAGE =================
router.post("/message", auth, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const msg = await Message.create({
      conversationId,
      sender: req.userId,
      text,
      readBy: [req.userId] // sender already read
    });

    // ✅ update conversation properly
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text,
        sender: req.userId,
        createdAt: new Date()
      },
      updatedAt: new Date()
    });

    res.json(msg);

  } catch (err) {
    console.error("SEND MSG ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;