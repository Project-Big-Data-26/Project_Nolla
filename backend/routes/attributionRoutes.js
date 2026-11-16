const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  authorizeReport,
  collectVisit,
  getReport,
} = require("../controllers/attributionController");

const router = express.Router();

router.post("/visit", collectVisit);
router.get("/report", authMiddleware, authorizeReport, getReport);

module.exports = router;
