const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String }, // Nama badge
    description: { type: String }, // Deskripsi/syarat
    icon_url: { type: String }, // URL ikon
    criteria: { type: mongoose.Schema.Types.Mixed, default: {} }, // Kriteria badge
  },
  { timestamps: false },
);

module.exports = mongoose.model("Badge", badgeSchema, "badges");
