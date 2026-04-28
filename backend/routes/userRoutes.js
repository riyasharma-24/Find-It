const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// GET USER
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

// UPDATE USER
router.put("/update", auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, city } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { firstName, lastName, phone, city },
      { new: true }
    ).select("-password");

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;