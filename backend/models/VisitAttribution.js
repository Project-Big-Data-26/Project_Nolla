const mongoose = require("mongoose");
const {
  CAMPAIGNS,
  MEDIUMS,
  SOURCES,
  CONTENTS,
  PLACEMENT_ID_PATTERN,
} = require("../services/attributionSchema");

const visitAttributionSchema = new mongoose.Schema(
  {
    visit_id: { type: String, required: true, match: /^vst_[0-9a-f]{48}$/ },
    attribution_type: {
      type: String,
      enum: ["utm", "direct", "unknown"],
      required: true,
    },
    source: { type: String, enum: SOURCES, required: true },
    medium: { type: String, enum: MEDIUMS, required: true },
    campaign: { type: String, enum: CAMPAIGNS, default: null },
    content: { type: String, enum: CONTENTS, default: null },
    placement_id: {
      type: String,
      match: PLACEMENT_ID_PATTERN,
      maxlength: 64,
      default: null,
    },
    analytics_user_id: { type: String, default: null },
    first_seen_at: { type: Date, required: true },
    conversions: {
      registration_at: { type: Date, default: null },
      quiz_started_at: { type: Date, default: null },
      quiz_completed_at: { type: Date, default: null },
    },
    expires_at: { type: Date, required: true },
  },
  { timestamps: false, minimize: false },
);

visitAttributionSchema.index({ visit_id: 1 }, { unique: true });
visitAttributionSchema.index({ first_seen_at: 1 });
visitAttributionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model(
  "VisitAttribution",
  visitAttributionSchema,
  "visit_attributions",
);
