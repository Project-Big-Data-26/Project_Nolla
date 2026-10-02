const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    googleId: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    allJenjang: {
      type: Boolean,
      default: false,
    },

    jenjang_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jenjang",
      default: null,
    },

    role: {
      type: String,
      enum: ["Siswa", "Guru", "Admin"],
      default: "Siswa",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
