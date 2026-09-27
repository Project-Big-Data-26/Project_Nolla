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
  },
  { timestamps: false },
);

mengerjakanPretestSchema.index({ user_id: 1, bab_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "MengerjakanPretest",
  mengerjakanPretestSchema,
  "mengerjakan_pretest",
);
