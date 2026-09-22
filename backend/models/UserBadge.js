const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User
    badge_id: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" }, // Badge
    earned_at: { type: Date }, // Waktu diperoleh
  },
  { timestamps: false },
);

userBadgeSchema.index({ user_id: 1 });
userBadgeSchema.index({ badge_id: 1 });
userBadgeSchema.index({ user_id: 1, badge_id: 1 }, { unique: true });

module.exports = mongoose.model("UserBadge", userBadgeSchema, "user_badges");
