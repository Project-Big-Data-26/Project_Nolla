const mongoose = require("mongoose");

const RevokedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hapus otomatis ketika expiresAt tercapai
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RevokedToken", RevokedTokenSchema);
