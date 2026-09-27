const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getClassesByToken,
} = require("../controllers/master-data/classController");
const { getBab } = require("../controllers/dashboardController");

router.get("/classes", authMiddleware, getClassesByToken);
router.get("/bab", authMiddleware, getBab);

module.exports = router;
