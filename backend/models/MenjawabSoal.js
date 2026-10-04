const mongoose = require("mongoose");

const menjawabSoalSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    soal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Soal",
      required: true,
    },
    dikerjakan_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

menjawabSoalSchema.index({ user_id: 1, soal_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "MenjawabSoal",
  menjawabSoalSchema,
  "menjawab_soal",
);
