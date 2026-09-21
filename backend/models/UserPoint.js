const mongoose = require("mongoose");

const userPointSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User
    source_type: { type: String }, // Sumber poin
    source_id: { type: mongoose.Schema.Types.ObjectId }, // ID sumber
    points: { type: Number }, // Jumlah poin
    created_at: { type: Date }, // Waktu diperoleh
  },
  { timestamps: false },
);

userPointSchema.index({ user_id: 1 });

module.exports = mongoose.model("UserPoint", userPointSchema, "user_points");
