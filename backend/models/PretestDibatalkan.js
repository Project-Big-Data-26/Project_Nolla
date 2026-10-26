const mongoose = require("mongoose");

const jawabanArsipSchema = new mongoose.Schema(
  {
    soal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Soal" },
    stage: { type: String },
    selected_answer: { type: String, default: null },
    is_correct: { type: Boolean, default: null },
    kunci_jawaban: { type: String, default: null },
    response_time: { type: Number, default: null },
    response_time_ms: { type: Number, default: null },
    response_time_partial: { type: Boolean, default: null },
    sequence: { type: Number },
    answered_at: { type: Date, default: null },
  },
  { _id: false },
);

// Arsip sesi pretest yang dibatalkan siswa agar dropout tetap terhitung.
// Bukan permintaan penghapusan data pribadi; hak hapus tetap harus menjangkau koleksi ini.
const pretestDibatalkanSchema = new mongoose.Schema(
  {
    pretest_id: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    started_at: { type: Date, default: null },
    cancelled_at: { type: Date, required: true },
    last_question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Soal",
      default: null,
    },
    answered_count: { type: Number, required: true },
    jawaban: { type: [jawabanArsipSchema], default: [] },
  },
  { timestamps: false },
);

pretestDibatalkanSchema.index({ pretest_id: 1 }, { unique: true });
pretestDibatalkanSchema.index({ user_id: 1, bab_id: 1, cancelled_at: -1 });

module.exports = mongoose.model(
  "PretestDibatalkan",
  pretestDibatalkanSchema,
  "pretest_dibatalkan",
);
