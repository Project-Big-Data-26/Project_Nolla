const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    option_id: { type: String, required: true },
    text: { type: String, required: true },
    alasan: { type: String, default: null },
  },
  { _id: false },
);

const soalSchema = new mongoose.Schema(
  {
    berkas_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Berkas",
      default: null,
    },
    subbab_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subbab",
      required: true,
    },
    kelas_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kelas",
      required: true,
    },
    soal_text: { type: String, required: true },
    image_url: { type: [String], default: [] },
    soal_type: { type: String, default: "multiple_choice" },
    options: { type: [optionSchema], default: [] },
    correct_answer: { type: String, required: true },
    cognitive_level: { type: String, enum: ["easy", "medium", "hard"] },
    cognitive_score: { type: Number },
    status: { type: String, default: "active" },
    confidence_score: { type: Number, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

soalSchema.index({ subbab_id: 1 });
soalSchema.index({ kelas_id: 1 });

module.exports = mongoose.model("Soal", soalSchema, "soal");
