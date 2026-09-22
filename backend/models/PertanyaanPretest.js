const mongoose = require("mongoose");

const pertanyaanPretestSchema = new mongoose.Schema(
  {
    pretest_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pretest" }, // Sesi pretest
    pertanyaan_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pertanyaan" }, // Soal
    selected_answer: { type: String }, // Jawaban user
    is_correct: { type: Boolean }, // Benar/salah
    response_time: { type: Number }, // Waktu menjawab
  },
  { timestamps: false },
);

pertanyaanPretestSchema.index({ pretest_id: 1 });
pertanyaanPretestSchema.index({ pertanyaan_id: 1 });

module.exports = mongoose.model(
  "PertanyaanPretest",
  pertanyaanPretestSchema,
  "pertanyaan_pretest",
);
