const mongoose = require("mongoose");

const menyelesaikanSubbabSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subbab_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subbab",
      required: true,
    },
    completed_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

menyelesaikanSubbabSchema.index({ user_id: 1, subbab_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "MenyelesaikanSubbab",
  menyelesaikanSubbabSchema,
  "menyelesaikan_subbab",
);
