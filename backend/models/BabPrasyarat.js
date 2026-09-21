const mongoose = require("mongoose");

const babPrasyaratSchema = new mongoose.Schema(
  {
    bab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bab" }, // BAB yang membutuhkan prasyarat
    relasi_bab_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bab" }, // BAB prasyarat
  },
  { timestamps: false },
);

babPrasyaratSchema.index({ bab_id: 1 });
babPrasyaratSchema.index({ relasi_bab_id: 1 });
babPrasyaratSchema.index({ bab_id: 1, relasi_bab_id: 1 }, { unique: true });

module.exports = mongoose.model("BabPrasyarat", babPrasyaratSchema, "bab_prasyarat");
