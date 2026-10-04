const mongoose = require("mongoose");

const memilikiPrasyaratSchema = new mongoose.Schema(
  {
    bab_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bab",
      required: true,
    },
    relasi_bab_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bab",
      required: true,
    },
  },
  { timestamps: false },
);

memilikiPrasyaratSchema.index(
  { bab_id: 1, relasi_bab_id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "MemilikiPrasyarat",
  memilikiPrasyaratSchema,
  "memiliki_prasyarat",
);
