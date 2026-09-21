const mongoose = require("mongoose");

const userPertanyaanSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pertanyaan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pertanyaan",
    },
    dikerjakan_at: {
      type: Date,
    },
  },
  { timestamps: false },
);

userPertanyaanSchema.index({ user_id: 1 });
userPertanyaanSchema.index({ pertanyaan_id: 1 });
userPertanyaanSchema.index(
  { user_id: 1, pertanyaan_id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "UserPertanyaan",
  userPertanyaanSchema,
  "user_pertanyaan",
);