// Mengganti Soal.image_url (nama file "images/a.png" atau public_id ringkas
// "nolla/soal/images/a.png") menjadi URL Cloudinary lengkap, TANPA butuh file lokal
// dan TANPA API Secret. Gambar harus sudah ada di Cloudinary.
//
//   node scripts/linkCloudinaryUrls.js                         -> simulasi (hanya membaca)
//   node scripts/linkCloudinaryUrls.js --apply --db <nama_db>  -> ubah database
//
// Env: MONGO_URI, CLOUDINARY_CLOUD_NAME (opsional: CLOUDINARY_FOLDER, default "nolla/soal")
//
// Pengaman:
//  - Tiap gambar dicek dulu ke Cloudinary (HEAD). Soal yang gambarnya tidak ditemukan TIDAK diubah.
//  - --apply wajib disertai --db <nama database> yang sama dengan database yang tersambung.
//  - Nilai lama dicadangkan ke reports/image-url-backup-*.json (bisa dipulihkan dengan restoreBackup.js).
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { toCloudinaryUrl, toPublicId } = require("../utils/cloudinaryImage");

const REPORT_DIRECTORY = path.resolve(__dirname, "../reports");

const urlExists = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status === 200;
  } catch {
    return false;
  }
};

const checkAll = async (urls, concurrency = 8) => {
  const queue = [...urls];
  const result = new Map();
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      result.set(url, await urlExists(url));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) || 1 }, worker));
  return result;
};

const parseArgs = (argv) => {
  const args = { apply: argv.includes("--apply"), db: null };
  const index = argv.indexOf("--db");
  if (index !== -1) args.db = argv[index + 1] || null;
  return args;
};

const main = async () => {
  const { apply, db } = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diisi.");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME belum diisi.");

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const dbName = mongoose.connection.name;
  console.log(`Mode     : ${apply ? "APPLY (mengubah data)" : "SIMULASI (hanya membaca)"}`);
  console.log(`Database : ${dbName}`);

  if (apply && db !== dbName) {
    throw new Error(
      `--apply harus disertai --db ${dbName} (nama database yang tersambung). Nilai --db sekarang: ${db ?? "(kosong)"}.`,
    );
  }

  const Soal = require("../models/Soal");
  const soalList = await Soal.find({ "image_url.0": { $exists: true } }).select("image_url").lean();

  const unresolved = new Set();
  const candidates = soalList.map((soal) => {
    let needsChange = false;
    const next = soal.image_url.map((value) => {
      if (typeof value === "string" && /^https?:\/\//i.test(value)) return { keep: value };
      const url = toCloudinaryUrl(cloudName, value);
      if (!url) {
        unresolved.add(String(value));
        return { bad: value };
      }
      needsChange = true;
      return { url, from: value };
    });
    return { _id: soal._id, original: soal.image_url, next, needsChange };
  });

  const urlsToCheck = new Set();
  candidates.forEach((c) => c.next.forEach((n) => n.url && urlsToCheck.add(n.url)));
  console.log(`Soal bergambar: ${soalList.length}`);
  console.log(`Alamat Cloudinary yang dicek: ${urlsToCheck.size} (mohon tunggu)...`);
  const exists = await checkAll(urlsToCheck);

  const missing = [...exists].filter(([, ok]) => !ok).map(([url]) => url);
  const plan = candidates.filter(
    (c) => c.needsChange && c.next.every((n) => n.keep || (n.url && exists.get(n.url))),
  );
  const skipped = candidates.filter((c) => c.needsChange && !plan.includes(c));
  const alreadyDone = candidates.filter((c) => !c.needsChange && c.next.every((n) => n.keep)).length;

  console.log(`Gambar ditemukan di Cloudinary : ${urlsToCheck.size - missing.length}`);
  console.log(`Gambar TIDAK ditemukan         : ${missing.length}`);
  console.log(`Soal yang akan diubah          : ${plan.length}`);
  console.log(`Soal dilewati (ada gambar hilang): ${skipped.length}`);
  console.log(`Soal yang sudah berupa URL      : ${alreadyDone}`);
  if (unresolved.size) {
    console.log(`\nNilai tidak dikenali (${unresolved.size}):`);
    [...unresolved].slice(0, 10).forEach((v) => console.log(`  - ${v}`));
  }
  if (missing.length) {
    console.log("\nContoh alamat yang tidak ditemukan:");
    missing.slice(0, 5).forEach((u) => console.log(`  - ${u}`));
  }

  if (!apply) {
    console.log("\nSimulasi selesai. Untuk mengubah database:");
    console.log(`  node scripts/linkCloudinaryUrls.js --apply --db ${dbName}`);
    await mongoose.disconnect();
    return;
  }

  if (!plan.length) {
    console.log("\nTidak ada yang diubah.");
    await mongoose.disconnect();
    return;
  }

  fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(REPORT_DIRECTORY, `image-url-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(plan.map(({ _id, original }) => ({ _id, image_url: original })), null, 2),
  );
  console.log(`\nBackup nilai lama: ${backupPath}`);

  const result = await Soal.bulkWrite(
    plan.map((c) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { image_url: c.next.map((n) => n.keep ?? n.url) } },
      },
    })),
  );
  console.log(`Database diperbarui: ${result.modifiedCount} soal.`);
  await mongoose.disconnect();
};

if (require.main === module) {
  main().catch(async (error) => {
    console.error("Gagal:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { toPublicId, toCloudinaryUrl, checkAll };