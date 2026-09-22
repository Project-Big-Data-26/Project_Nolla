const mongoose = require("mongoose");

const subbabSchema = new mongoose.Schema(
  {
    bab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bab" }, // Relasi BAB
    name: { type: String }, // Nama subbab
    description: { type: String, default: null }, // Deskripsi subbab
    display_order: { type: Number }, // Urutan subbab
  },
  { timestamps: false },
);

subbabSchema.index({ bab_id: 1 });

module.exports = mongoose.model("Subbab", subbabSchema, "subbab");
