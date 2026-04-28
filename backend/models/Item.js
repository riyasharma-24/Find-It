const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  type: { type: String, enum: ["lost", "found"], required: true },
  location: String,
  images: {
  type: [String],
  default: []
},

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);