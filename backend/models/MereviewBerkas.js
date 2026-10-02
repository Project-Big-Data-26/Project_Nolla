const mongoose = require("mongoose");

const mereviewBerkasSchema = new mongoose.Schema(
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
    decision: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
    reason: { type: String, default: null },
    reviewed_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

mereviewBerkasSchema.index({ user_id: 1, berkas_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "MereviewBerkas",
  mereviewBerkasSchema,
  "mereview_berkas",
);
