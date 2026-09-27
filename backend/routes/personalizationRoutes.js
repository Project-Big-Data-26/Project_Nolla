const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { setPersonalization } = require("../controllers/personalizationController");

const router = express.Router();

router.post("/", authMiddleware, setPersonalization);

module.exports = router;