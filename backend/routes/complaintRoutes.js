const express = require("express");
const multer = require("multer");
const { createComplaint } = require("../controllers/complaintController");

const router = express.Router();
const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Format lampiran harus PNG, JPG, atau WEBP.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

router.post(
  "/",
  (req, res, next) => {
    uploadAttachment.single("attachment")(req, res, (error) => {
      if (!error) return next();
      const tooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
      const status = tooLarge ? 400 : error.status || 400;
      return res.status(status).json({
        success: false,
        message: tooLarge ? "Ukuran gambar maksimal 5 MB." : error.message,
      });
    });
  },
  createComplaint,
);

module.exports = router;
