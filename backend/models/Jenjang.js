const mongoose = require("mongoose");

const jenjangSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["SD", "SMP", "SMA"],
    },
  },
  { timestamps: false },
);

module.exports = mongoose.model("Jenjang", jenjangSchema, "jenjang");