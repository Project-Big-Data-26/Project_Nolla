const mongoose = require("mongoose");

const assessmentFeedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessment_type: {
      type: String,
      enum: ["pretest", "quiz"],
      required: true,
    },
    attempt_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500, default: "" },
    submitted_at: { type: Date, default: Date.now, required: true },
  },
  { versionKey: false },
);

assessmentFeedbackSchema.index(
  { user_id: 1, assessment_type: 1, attempt_id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "AssessmentFeedback",
  assessmentFeedbackSchema,
  "assessment_feedback",
);
