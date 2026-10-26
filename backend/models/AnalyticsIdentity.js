const mongoose = require("mongoose");

// Satu-satunya penghubung pseudonim analytics ke akun. Akses dibatasi;
// menghapus baris ini memutus event dari identitas siswa.
const analyticsIdentitySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    analytics_user_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

analyticsIdentitySchema.index({ user_id: 1 }, { unique: true });
analyticsIdentitySchema.index({ analytics_user_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "AnalyticsIdentity",
  analyticsIdentitySchema,
  "analytics_identities",
);
