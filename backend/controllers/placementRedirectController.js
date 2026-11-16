const {
  PLACEMENT_ID_PATTERN,
  readPlacements,
} = require("../services/attributionSchema");

const redirectToPlacement = (req, res) => {
  try {
    const placementId = req.params.placement;
    const placements = readPlacements();
    if (
      typeof placementId !== "string" ||
      !PLACEMENT_ID_PATTERN.test(placementId) ||
      !Object.prototype.hasOwnProperty.call(placements, placementId)
    ) {
      return res.redirect(302, "/");
    }

    const query = new URLSearchParams({
      utm_source: "school_visit",
      utm_medium: "poster_qr",
      utm_campaign: "promosi_nolla",
      utm_content: "poster",
      placement_id: placementId,
    });
    return res.redirect(302, `/?${query.toString()}`);
  } catch (error) {
    console.error("Placement redirect configuration is invalid:", error.message);
    return res.status(503).json({
      statusCode: 503,
      success: false,
      message: "Tautan poster belum dapat diproses.",
    });
  }
};

module.exports = { redirectToPlacement };
