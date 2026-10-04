const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
  {
    img_url: {
      type: String,
      required: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Avatar", avatarSchema, "avatar");