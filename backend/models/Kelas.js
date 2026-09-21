const mongoose = require("mongoose");

const kelasSchema = new mongoose.Schema(
  {
    jenjang_id: { type: mongoose.Schema.Types.ObjectId, ref: "Jenjang" }, // Relasi jenjang
    name: { type: String }, // Nama kelas
    nomor_kelas: { type: Number }, // Nomor kelas
  },
  { timestamps: false },
);

kelasSchema.index({ jenjang_id: 1 });

module.exports = mongoose.model("Kelas", kelasSchema, "kelas");
