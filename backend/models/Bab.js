const mongoose = require("mongoose");

const babSchema = new mongoose.Schema(
  {
    kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: "Kelas" }, // Relasi kelas
    name: { type: String }, // Nama BAB
    description: { type: String, default: null }, // Deskripsi BAB
    display_order: { type: Number }, // Urutan BAB
  },
  { timestamps: false },
);

babSchema.index({ kelas_id: 1 });

module.exports = mongoose.model("Bab", babSchema, "bab");
