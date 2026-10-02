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
      immutable: true,
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

    avatar: {
      type: String,
      enum: [
        "avatar_1",
        "avatar_2",
        "avatar_3",
        "avatar_4",
        "avatar_5",
        "avatar_6",
      ],
      default: "avatar_1",
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