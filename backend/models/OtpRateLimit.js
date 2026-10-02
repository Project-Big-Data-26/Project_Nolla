const mongoose = require("mongoose");

const otpRateLimitSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: new Date(0),
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OtpRateLimit", otpRateLimitSchema);