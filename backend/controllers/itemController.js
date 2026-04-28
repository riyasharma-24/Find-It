const Item = require("../models/Item");

exports.getItemById = async (req, res) => {
  try {
    const item = await Item
      .findById(req.params.id)
      .populate("user", "firstName lastName phone");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};