const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  startQuiz,
  submitQuiz,
  getQuizResult,
} = require("../controllers/quizController");

const router = express.Router();

router.post("/start", authMiddleware, startQuiz);
router.post("/:sessionId/submit", authMiddleware, submitQuiz);
router.get("/:sessionId/result", authMiddleware, getQuizResult);

module.exports = router;
