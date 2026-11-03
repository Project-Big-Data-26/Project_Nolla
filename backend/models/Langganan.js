const mongoose = require("mongoose");

// Periode hak akses premium (append-only). Paket free = tidak ada periode aktif.
// source "trial" = freemium (sekali per akun), "manual" = diberikan lewat script,
// "payment" = disiapkan untuk payment gateway.
const langgananSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: { type: String, enum: ["premium"], default: "premium" },
    // Tipe paket Premium (config/premiumPlans.js); null untuk trial atau manual per hari.
    package: {
      type: String,
      enum: ["weekly", "monthly", "yearly", null],
      default: null,
    },
    source: {
      type: String,
      enum: ["trial", "manual", "payment"],
      required: true,
    },
    starts_at: { type: Date, required: true },
    ends_at: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.starts_at || value > this.starts_at;
        },
        message: "ends_at harus setelah starts_at",
      },
    },
    cancelled_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

langgananSchema.index({ user_id: 1, ends_at: -1 });
// Trial hanya sekali per akun, juga saat request aktivasi paralel.
langgananSchema.index(
  { user_id: 1 },
  { unique: true, partialFilterExpression: { source: "trial" } },
);

module.exports = mongoose.model("Langganan", langgananSchema, "langganan");
