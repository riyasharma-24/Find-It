const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  city: String,
  password: String,

  rating: { type: Number, default: 5 },
  badges: { type: [String], default: ["New User"] },

  stats: {
    reported: { type: Number, default: 0 },
    found: { type: Number, default: 0 },
    reunited: { type: Number, default: 0 }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);