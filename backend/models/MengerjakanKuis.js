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
    // Satuan detik (kontrak lama); data baru memakai response_time_ms.
    response_time: { type: Number },
    response_time_ms: { type: Number, default: null },
    response_time_partial: { type: Boolean, default: null },
    rating_at_selection: { type: Number, default: null },
    question_rating_before: { type: Number, default: null },
    question_rating_after: { type: Number, default: null },
    student_rating_before: { type: Number, default: null },
    student_rating_after: { type: Number, default: null },
    kunci_jawaban: { type: String, default: null },
    content_hash: { type: String, default: null },
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
    active_key: { type: String },
    cognitive_level: { type: String },
    // Rating siswa saat attempt dibuat.
    cognitive_score: { type: Number },
    cognitive_score_after: { type: Number, default: null },
    selection_policy_version: { type: String, default: null },
    scoring_version: { type: String, default: null },
    selection: {
      track: { type: String, default: null },
      candidate_count: { type: Number, default: null },
      available_count: { type: Number, default: null },
    },
    timing_method: { type: String, default: null },
    // "pending" tertinggal = efek rating gagal sebagian (hanya mungkin tanpa transaksi).
    rating_sync: { type: String, enum: ["pending", "applied"], default: null },
    soal: { type: [soalKuisSchema], default: [] },
    // Jumlah jawaban benar, bukan persentase.
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
// Maksimal satu attempt aktif per user–subbab; active_key dilepas saat submit.
mengerjakanKuisSchema.index(
  { active_key: 1 },
  { unique: true, partialFilterExpression: { active_key: { $type: "string" } } },
);

module.exports = mongoose.model(
  "MengerjakanKuis",
  mengerjakanKuisSchema,
  "mengerjakan_kuis",
);
