const mongoose = require("mongoose");

const RevokedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },

    // Index TTL didefinisikan di bawah; `index: true` di sini membuat opsi TTL diabaikan.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hapus otomatis ketika expiresAt tercapai
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RevokedToken", RevokedTokenSchema);
