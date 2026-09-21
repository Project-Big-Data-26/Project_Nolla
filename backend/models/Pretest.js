const mongoose = require("mongoose");

const pretestSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User
    bab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bab" }, // BAB diuji
    score: { type: mongoose.Schema.Types.Decimal128 }, // Nilai pretest
    duration: { type: Number }, // Durasi pengerjaan
    started_at: { type: Date }, // Waktu mulai
    completed_at: { type: Date }, // Waktu selesai
  },
  { timestamps: false },
);

pretestSchema.index({ user_id: 1 });
pretestSchema.index({ bab_id: 1 });
pretestSchema.index({ user_id: 1, bab_id: 1 }, { unique: true });

module.exports = mongoose.model("Pretest", pretestSchema, "pretest");
