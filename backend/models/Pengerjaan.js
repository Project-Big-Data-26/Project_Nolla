const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    option_id: { type: String }, // ID opsi
    text: { type: String }, // Teks opsi
  },
  { _id: false },
);

const pertanyaanSchema = new mongoose.Schema(
  {
    subbab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subbab" }, // Relasi subbab
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas" }, // Label kelas
    pertanyaan_text: { type: String }, // Teks pertanyaan
    image_url: { type: String, default: null }, // URL gambar
    pertanyaan_type: { type: String }, // Jenis pertanyaan
    options: { type: [optionSchema], default: [] }, // Opsi jawaban
    correct_answer: { type: String }, // Jawaban benar
    cognitive_level: { type: String }, // C1-C6
    cognitive_score: { type: Number }, // 200-1200
    status: { type: String }, // Status soal
    created_at: { type: Date }, // Waktu dibuat
    updated_at: { type: Date }, // Waktu diperbarui
  },
  { timestamps: false },
);

pertanyaanSchema.index({ subbab_id: 1 });
pertanyaanSchema.index({ kelas_id: 1 });

module.exports = mongoose.model("Pertanyaan", pertanyaanSchema, "pertanyaan");
