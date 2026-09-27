const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User
    current_streak: { type: Number }, // Streak saat ini
    longest_streak: { type: Number }, // Streak terpanjang
    last_activity_date: { type: Date }, // Aktivitas terakhir
  },
  { timestamps: false },
);

streakSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model("Streak", streakSchema, "streaks");
