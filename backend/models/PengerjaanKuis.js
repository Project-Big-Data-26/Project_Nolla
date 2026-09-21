const mongoose = require("mongoose");

const soalKuisSchema = new mongoose.Schema(
  {
    pertanyaan_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pertanyaan" }, // Soal
    pilihan_jawaban: { type: String }, // Jawaban user
    is_correct: { type: Boolean }, // Benar/salah
    response_time: { type: Number }, // Waktu menjawab (detik)
  },
  { _id: false },
);

const pengerjaanKuisSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User
    bab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bab" }, // BAB
    cognitive_level: { type: String }, // Level kognitif
    cognitive_score: { type: Number }, // Skor kognitif
    soal: { type: [soalKuisSchema], default: [] }, // Soal dan jawaban
    score: { type: mongoose.Schema.Types.Decimal128 }, // Nilai kuis
    points_earned: { type: Number }, // Poin
    duration: { type: Number }, // Durasi
    started_at: { type: Date }, // Mulai
    completed_at: { type: Date }, // Selesai
  },
  { timestamps: false },
);

pengerjaanKuisSchema.index({ user_id: 1 });
pengerjaanKuisSchema.index({ bab_id: 1 });

module.exports = mongoose.model(
  "PengerjaanKuis",
  pengerjaanKuisSchema,
  "pengerjaan_kuis",
);
