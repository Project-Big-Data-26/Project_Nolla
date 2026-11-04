// Dipasang di /api/staging hanya bila APP_ENV=staging (lihat index.js).
// Sengaja di luar routes/*.js agar tidak ikut dokumentasi Swagger.
const express = require("express");
const { isStagingEnv } = require("../../config/appEnv");
const {
  getCheckTree,
  getSubbabChecks,
  getSoalCheck,
  updateSoalCheck,
} = require("../../controllers/stagingSoalCheckController");

const router = express.Router();

// Lapisan kedua: tetap 404 bila router terpasang di luar staging.
router.use((req, res, next) => {
  if (!isStagingEnv()) return res.status(404).json({ statusCode: 404, success: false, message: "Not Found" });
  next();
});

// Dipakai frontend untuk menampilkan label/tombol cek hanya di staging.
router.get("/status", (req, res) =>
  res.status(200).json({ statusCode: 200, success: true, data: { app_env: "staging" } }),
);
router.get("/soal-check/tree", getCheckTree);
router.get("/soal-check/subbab/:subbab_id", getSubbabChecks);
router.get("/soal-check/soal/:soal_id", getSoalCheck);
router.patch("/soal-check/soal/:soal_id", updateSoalCheck);

module.exports = router;
