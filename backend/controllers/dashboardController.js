const Item = require("../models/Item");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id; // from authMiddleware

    const items = await Item.find({ userId });

    const lost = items.filter(i => i.type === "lost").length;
    const found = items.filter(i => i.type === "found").length;

    // basic logic (you can improve later)
    const reunited = Math.floor(found / 2);
    const rating = 4.9; // later from DB

    const nearby = await Item.countDocuments(); // or filter by location later

    const notifications = 2; // later from messages/chat

    res.json({
      lost,
      found,
      reunited,
      rating,
      nearby,
      notifications
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getItems = async (req, res) => {
  try {
    console.log("USER:", req.user);

    const items = await Item.find();

    res.json(items);
  } catch (err) {
    console.error("ITEM ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};