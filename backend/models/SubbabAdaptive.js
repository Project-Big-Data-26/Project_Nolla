const mongoose = require("mongoose");

const subbabAdaptiveSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User
    subbab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subbab" }, // Subbab
    initial_cognitive_level: { type: String }, // Level awal practice
    initial_cognitive_score: { type: Number }, // Skor awal practice
    pretest_subbab_correct: { type: Number }, // Jumlah benar
    pretest_subbab_total: { type: Number }, // Jumlah soal
    updated_at: { type: Date }, // Waktu diperbarui
  },
  { timestamps: false },
);

subbabAdaptiveSchema.index({ user_id: 1 });
subbabAdaptiveSchema.index({ subbab_id: 1 });
subbabAdaptiveSchema.index({ user_id: 1, subbab_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "SubbabAdaptive",
  subbabAdaptiveSchema,
  "subbab_adaptive",
);
