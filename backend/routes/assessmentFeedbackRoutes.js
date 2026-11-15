const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  submitAssessmentFeedback,
} = require("../controllers/assessmentFeedbackController");

const router = express.Router();

router.post("/", authMiddleware, submitAssessmentFeedback);

module.exports = router;
