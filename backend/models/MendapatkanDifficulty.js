const mongoose = require("mongoose");

const mendapatkanDifficultySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subbab_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subbab",
      required: true,
    },
    current_cognitive_level: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    current_cognitive_score: { type: Number, required: true },
    pretest_subbab_correct: { type: Number, default: 0 },
    pretest_subbab_total: { type: Number, default: 0 },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

mendapatkanDifficultySchema.index(
  { user_id: 1, subbab_id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "MendapatkanDifficulty",
  mendapatkanDifficultySchema,
  "mendapatkan_difficulty",
);
