const mongoose = require("mongoose");

const menjawabSoalPretestSchema = new mongoose.Schema(
  {
    pretest_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MengerjakanPretest",
      required: true,
    },
    soal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Soal",
      required: true,
    },
    stage: {
      type: String,
      enum: ["prerequisite", "subbab"],
      required: true,
    },
    selected_answer: { type: String, default: null },
    is_correct: { type: Boolean, default: null },
    kunci_jawaban: { type: String, default: null },
    // Satuan detik (kontrak lama); data baru memakai response_time_ms.
    response_time: { type: Number, default: null },
    response_time_ms: { type: Number, default: null },
    response_time_partial: { type: Boolean, default: null },
    sequence: { type: Number, required: true },
    answered_at: { type: Date, default: null },
  },
  { timestamps: false },
);

menjawabSoalPretestSchema.index(
  { pretest_id: 1, sequence: 1 },
  { unique: true },
);
menjawabSoalPretestSchema.index(
  { pretest_id: 1, soal_id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "MenjawabSoalPretest",
  menjawabSoalPretestSchema,
  "menjawab_soal_pretest",
);
