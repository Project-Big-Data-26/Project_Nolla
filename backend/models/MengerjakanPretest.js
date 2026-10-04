const mongoose = require("mongoose");

const mengerjakanPretestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bab_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bab",
      required: true,
    },
    score: { type: mongoose.Schema.Types.Decimal128 },
    duration: { type: Number },
    started_at: { type: Date },
    completed_at: { type: Date },
    current_question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Soal",
      default: null,
    },
    subbab_cognitive_scores: [
      {
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
      },
    ],
  },
  { timestamps: false },
);

mengerjakanPretestSchema.index({ user_id: 1, bab_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "MengerjakanPretest",
  mengerjakanPretestSchema,
  "mengerjakan_pretest",
);
