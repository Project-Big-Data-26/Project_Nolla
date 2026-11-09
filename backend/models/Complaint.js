const mongoose = require("mongoose");

const COMPLAINT_TYPES = [
  "Masalah teknis",
  "Kesalahan materi atau soal",
  "Masalah akun",
  "Masalah paket atau pembayaran",
  "Laporkan penyalahgunaan",
  "Lainnya",
];

const complaintSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    type: { type: String, required: true, enum: COMPLAINT_TYPES },
    subject: { type: String, required: true, trim: true, minlength: 4, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    attachment: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
      format: { type: String, default: null },
      bytes: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: ["Baru", "Diproses", "Selesai"],
      default: "Baru",
      index: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

complaintSchema.index({ created_at: -1 });

module.exports = mongoose.model("Complaint", complaintSchema, "complaints");
module.exports.COMPLAINT_TYPES = COMPLAINT_TYPES;
