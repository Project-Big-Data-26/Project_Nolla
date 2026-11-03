require("dotenv").config();
const mongoose = require("mongoose");

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum terisi di .env");

  await mongoose.connect(process.env.MONGO_URI);
  const Soal = require("../models/Soal");

  const soals = await Soal.find({ "image_url.0": { $exists: true } });
  console.log(`Menemukan ${soals.length} soal untuk dirampingkan...`);

  let count = 0;
  for (const soal of soals) {
    const cleanUrls = soal.image_url.map((url) => {
      if (typeof url !== "string") return url;

      // Ambil bagian setelah '/upload/' dan bersihkan nomor versi (/v123456/)
      if (url.includes("/upload/")) {
        let publicId = url.split("/upload/")[1];
        publicId = publicId.replace(/^v\d+\//, ""); // Hapus versi
        return publicId;
      }
      return url;
    });

    await Soal.updateOne({ _id: soal._id }, { $set: { image_url: cleanUrls } });
    count++;
  }

  console.log(`Selesai! ${count} dokumen MongoDB kini menyimpan public_id ringkas.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Gagal:", err.message);
  await mongoose.disconnect();
});