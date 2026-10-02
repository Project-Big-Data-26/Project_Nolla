const mongoose = require("mongoose");

const soalKuisSchema = new mongoose.Schema(
  {
    soal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Soal",
      required: true,
    },
    pilihan_jawaban: { type: String },
    is_correct: { type: Boolean },
    response_time: { type: Number },
  },
  { _id: false },
);

const mengerjakanKuisSchema = new mongoose.Schema(
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
    sesi_ke: { type: Number, required: true },
    cognitive_level: { type: String },
    cognitive_score: { type: Number },
    soal: { type: [soalKuisSchema], default: [] },
    score: { type: mongoose.Schema.Types.Decimal128 },
    duration: { type: Number },
    started_at: { type: Date },
    completed_at: { type: Date },
  },
  { timestamps: false },
);

mengerjakanKuisSchema.index(
  { user_id: 1, subbab_id: 1, sesi_ke: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "MengerjakanKuis",
  mengerjakanKuisSchema,
  "mengerjakan_kuis",
);
