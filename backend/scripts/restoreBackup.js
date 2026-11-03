require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const REPORT_DIR = path.resolve(__dirname, "../reports");

const getLatestBackupFile = () => {
  if (!fs.existsSync(REPORT_DIR)) throw new Error("Folder reports tidak ditemukan!");
  const files = fs.readdirSync(REPORT_DIR).filter((f) => f.startsWith("image-url-backup-"));
  if (files.length === 0) throw new Error("File backup JSON tidak ditemukan di folder reports!");
  files.sort().reverse(); // Mengambil file backup yang paling baru
  return path.join(REPORT_DIR, files[0]);
};

const restore = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum terisi di .env");

  await mongoose.connect(process.env.MONGO_URI);
  const Soal = require("../models/Soal");

  const backupFile = getLatestBackupFile();
  console.log(`Menggunakan file backup: ${backupFile}`);

  const backupData = JSON.parse(fs.readFileSync(backupFile, "utf-8"));

  const operations = backupData.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { image_url: item.image_url } },
    },
  }));

  const result = await Soal.bulkWrite(operations);
  console.log(`Berhasil me-restore ${result.modifiedCount} soal ke path lokal asli!`);
  await mongoose.disconnect();
};

restore().catch(async (err) => {
  console.error("Gagal restore:", err.message);
  await mongoose.disconnect();
});