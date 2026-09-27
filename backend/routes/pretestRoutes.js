const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPretestStatus,
  startPretest,
  getNextQuestion,
  answerPretestQuestion,
  submitPretest,
  getPretestResult,
  discardPretest,
} = require("../controllers/pretestController");

const router = express.Router();

router.get("/status/:babId", authMiddleware, getPretestStatus);
router.post("/start", authMiddleware, startPretest);
router.get("/:pretestId/question", authMiddleware, getNextQuestion);
router.post("/:pretestId/answer", authMiddleware, answerPretestQuestion);
router.post("/:pretestId/submit", authMiddleware, submitPretest);
router.get("/:pretestId/result", authMiddleware, getPretestResult);
router.delete("/:pretestId/discard", authMiddleware, discardPretest);

module.exports = router;
