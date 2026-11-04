const mongoose = require("mongoose");

// Khusus staging: hasil cek tampilan soal (LaTeX/gambar/teks) per halaman.
// null = belum dicek, true = tampil benar, false = rusak. Koleksi `soal` tidak diubah.
// *_content_hash = versi konten soal saat dicek; bila soal diedit, hasil cek dianggap usang.
const stagingSoalCheckSchema = new mongoose.Schema(
  {
    soal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Soal", required: true },
    subbab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subbab", required: true },
    question_check: { type: Boolean, default: null },
    question_checked_at: { type: Date, default: null },
    question_content_hash: { type: String, default: null },
    review_check: { type: Boolean, default: null },
    review_checked_at: { type: Date, default: null },
    review_content_hash: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

stagingSoalCheckSchema.index({ soal_id: 1 }, { unique: true });
stagingSoalCheckSchema.index({ subbab_id: 1 });

module.exports = mongoose.model(
  "StagingSoalCheck",
  stagingSoalCheckSchema,
  "staging_soal_check",
);
