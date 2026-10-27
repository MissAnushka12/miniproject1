
const mongoose = require("mongoose");

const shopkeeperSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    shopName: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: ""
    },
    shopAddress: {
      type: String,
      default: ""
    },
    shopPicture: {
      type: String,
      default: ""
    },
    shopBanner: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    whatsapp: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: "shopkeeper"
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Shopkeeper ||
  mongoose.model("Shopkeeper", shopkeeperSchema);
