const express = require("express");
const { redirectToPlacement } = require("../controllers/placementRedirectController");

const router = express.Router();

router.get("/:placement", redirectToPlacement);

module.exports = router;
