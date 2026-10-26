const mongoose = require("mongoose");

const googleAuthCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

googleAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model(
  "GoogleAuthCode",
  googleAuthCodeSchema,
  "google_auth_codes",
);
