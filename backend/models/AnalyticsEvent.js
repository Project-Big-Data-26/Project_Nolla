const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    event_id: { type: String, required: true },
    event_name: { type: String, required: true },
    schema_version: { type: Number, required: true },
    event_source: { type: String, enum: ["browser", "server"], required: true },
    occurred_at: { type: Date, required: true },
    received_at: { type: Date, required: true },
    committed_at: { type: Date, default: null },
    environment: { type: String, required: true },
    app_version: { type: String, default: null },
    cohort: { type: String, enum: ["external", "internal"], required: true },
    analytics_user_id: { type: String, required: true },
    learning_session_id: { type: String, default: null },
    page_instance_id: { type: String, default: null },
    request_id: { type: String, default: null },
    assessment_type: { type: String, enum: ["pretest", "quiz"], default: null },
    assessment_attempt_id: { type: String, default: null },
    assessment_item_id: { type: String, default: null },
    route_name: { type: String, default: null },
    // Kunci dedup domain: retry dengan event_id baru tidak menggandakan fakta.
    business_key: { type: String, default: null },
    processing_context: {
      purpose: { type: String, required: true },
      notice_version: { type: String, default: null },
    },
    quality_flags: { type: [String], default: [] },
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },
    expires_at: { type: Date, default: null },
  },
  { timestamps: false, minimize: false },
);

analyticsEventSchema.index(
  { analytics_user_id: 1, event_id: 1 },
  { unique: true },
);
analyticsEventSchema.index(
  { business_key: 1 },
  { unique: true, partialFilterExpression: { business_key: { $type: "string" } } },
);
analyticsEventSchema.index({ analytics_user_id: 1, occurred_at: 1 });
analyticsEventSchema.index({ assessment_attempt_id: 1, occurred_at: 1 });
analyticsEventSchema.index({ event_name: 1, received_at: 1 });
analyticsEventSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model(
  "AnalyticsEvent",
  analyticsEventSchema,
  "analytics_events",
);
