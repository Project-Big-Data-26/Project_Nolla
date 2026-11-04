const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    package: { type: String, enum: ["weekly", "monthly", "yearly"], required: true },
    duration_days: { type: Number, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "IDR" },
    status: {
      type: String,
      enum: ["creating", "pending", "paid", "failed", "expired", "cancelled", "refunded"],
      default: "creating",
      index: true,
    },
    snap_token: { type: String, default: null },
    redirect_url: { type: String, default: null },
    midtrans_transaction_id: { type: String, default: null },
    payment_type: { type: String, default: null },
    paid_at: { type: Date, default: null },
    last_notification_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

paymentSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model("Payment", paymentSchema, "payments");
