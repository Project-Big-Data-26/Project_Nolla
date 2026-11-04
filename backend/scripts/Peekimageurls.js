// Hanya MEMBACA. Menampilkan database mana yang tersambung dan bentuk isi Soal.image_url.
//   node scripts/peekImageUrls.js
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const kind = (value) => {
  if (typeof value !== "string") return "lainnya";
  if (/^https?:\/\//i.test(value)) return "url_lengkap";
  if (value.startsWith("nolla/")) return "public_id_ringkas";
  return "nama_file";
};

const main = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diisi.");
  const masked = process.env.MONGO_URI.replace(/\/\/([^:]+):[^@]*@/, "//$1:***@");
  const host = masked.replace(/^mongodb(\+srv)?:\/\//, "").split("/")[0].split("@").pop();

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const rows = await mongoose.connection
    .collection("soal")
    .find({ "image_url.0": { $exists: true } }, { projection: { image_url: 1 } })
    .toArray();

  const counts = {};
  const samples = {};
  for (const row of rows) {
    for (const value of row.image_url) {
      const type = kind(value);
      counts[type] = (counts[type] || 0) + 1;
      samples[type] = samples[type] || [];
      if (samples[type].length < 2) samples[type].push(value);
    }
  }

  console.log(`Database : ${mongoose.connection.name}`);
  console.log(`Host     : ${host}`);
  console.log(`Soal bergambar: ${rows.length}`);
  console.log("Jumlah nilai per jenis:", counts);
  console.log("Contoh:", JSON.stringify(samples, null, 2));
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error("Gagal:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});