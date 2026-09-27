const mongoose = require("mongoose");

const mengunggahBerkasSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    berkas_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Berkas",
      required: true,
    },
    uploaded_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

mengunggahBerkasSchema.index({ user_id: 1, berkas_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "MengunggahBerkas",
  mengunggahBerkasSchema,
  "mengunggah_berkas",
);
