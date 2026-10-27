const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    language: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);