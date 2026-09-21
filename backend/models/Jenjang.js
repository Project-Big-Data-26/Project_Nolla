const mongoose = require("mongoose");

const jenjangSchema = new mongoose.Schema(
  { name: { type: String } }, // Nama jenjang
  { timestamps: false },
);

module.exports = mongoose.model("Jenjang", jenjangSchema, "jenjang");
