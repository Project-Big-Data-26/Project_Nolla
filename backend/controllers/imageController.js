const {
  IMAGE_DIRECTORY,
  findQuestionImageByToken,
} = require("../utils/questionImage");

const getQuestionImage = async (req, res) => {
  try {
    const fileName = await findQuestionImageByToken(req.params.token);

    if (!fileName) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Gambar soal tidak ditemukan.",
      });
    }

    res.set("Cache-Control", "public, max-age=86400");
    res.set("X-Content-Type-Options", "nosniff");
    return res.sendFile(fileName, { root: IMAGE_DIRECTORY }, (error) => {
      if (error && !res.headersSent) res.sendStatus(404);
    });
  } catch (error) {
    console.error("Get question image error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Gagal mengambil gambar soal.",
    });
  }
};

module.exports = { getQuestionImage };
