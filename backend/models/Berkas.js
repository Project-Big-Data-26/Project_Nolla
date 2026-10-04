const mongoose = require("mongoose");

const berkasSchema = new mongoose.Schema(
  {
    file_name: { type: String, required: true },
    file_url: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejection_reason: { type: String, default: null },
    uploaded_at: { type: Date, default: Date.now },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Berkas", berkasSchema, "berkas");
