// Memindahkan gambar soal dari backend/public/soal ke Cloudinary, lalu mengganti
// nama file di Soal.image_url dengan URL Cloudinary.
//
//   node scripts/migrateImagesToCloudinary.js            -> simulasi (tidak mengubah apa pun)
//   node scripts/migrateImagesToCloudinary.js --apply    -> upload + update database
//
// Env yang dibutuhkan: MONGO_URI, dan (hanya untuk --apply)
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
//
// Aman dijalankan ulang: upload memakai public_id tetap (overwrite), dan
// URL yang sudah berawalan http(s):// tidak disentuh.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const IMAGE_DIRECTORY = path.resolve(__dirname, "../public/soal");
const REPORT_DIRECTORY = path.resolve(__dirname, "../reports");
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "nolla/soal";
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

const listImageFiles = (directory, relativeDirectory = "") =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;
    if (entry.isDirectory()) {
      return listImageFiles(path.join(directory, entry.name), relativePath);
    }
    return entry.isFile() &&
      IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ? [relativePath]
      : [];
  });

// Mencocokkan nilai image_url di database dengan file di disk.
// Menerima "images/a.png", "/images/a.png", "soal/images/a.png", atau "a.png".
const createResolver = (files) => {
  const fileSet = new Set(files);
  const byBaseName = new Map();
  for (const file of files) {
    const base = path.posix.basename(file);
    byBaseName.set(base, [...(byBaseName.get(base) || []), file]);
  }

  return (value) => {
    const cleaned = String(value)
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^(public\/)?soal\//, "");
    if (fileSet.has(cleaned)) return cleaned;
    const matches = byBaseName.get(path.posix.basename(cleaned)) || [];
    return matches.length === 1 ? matches[0] : null;
  };
};

const publicIdFor = (relativePath) =>
  `${CLOUDINARY_FOLDER}/${relativePath.replace(/\.[^./]+$/, "")}`;

const parseFlags = (argv) => ({ apply: argv.includes("--apply") });

const main = async () => {
  const { apply } = parseFlags(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diisi.");

  const files = listImageFiles(IMAGE_DIRECTORY);
  const resolve = createResolver(files);
  console.log(`Mode: ${apply ? "APPLY (mengubah data)" : "SIMULASI (tidak mengubah apa pun)"}`);
  console.log(`File gambar di disk: ${files.length}`);

  await mongoose.connect(process.env.MONGO_URI);
  const Soal = require("../models/Soal");
  const soalList = await Soal.find({ "image_url.0": { $exists: true } })
    .select("image_url")
    .lean();

  const needed = new Set();
  const unmatched = new Set();
  const plan = [];
  for (const soal of soalList) {
    let changed = false;
    const next = soal.image_url.map((value) => {
      if (/^https?:\/\//i.test(value)) return value;
      const file = resolve(value);
      if (!file) {
        unmatched.add(value);
        return value;
      }
      needed.add(file);
      changed = true;
      return { file };
    });
    if (changed) plan.push({ _id: soal._id, original: soal.image_url, next });
  }

  console.log(`Soal bergambar: ${soalList.length}`);
  console.log(`Soal yang perlu diubah: ${plan.length}`);
  console.log(`File yang dipakai soal: ${needed.size}`);
  console.log(`File di disk yang tidak dipakai soal mana pun: ${files.length - needed.size}`);
  if (unmatched.size) {
    console.log(`\nPERINGATAN: ${unmatched.size} nilai image_url tidak cocok dengan file di disk:`);
    [...unmatched].slice(0, 20).forEach((value) => console.log(`  - ${value}`));
  }

  if (!apply) {
    console.log("\nSimulasi selesai. Jalankan dengan --apply untuk upload dan update database.");
    await mongoose.disconnect();
    return;
  }

  for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
    if (!process.env[key]) throw new Error(`${key} belum diisi.`);
  }
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(REPORT_DIRECTORY, `image-url-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(plan.map(({ _id, original }) => ({ _id, image_url: original })), null, 2),
  );
  console.log(`\nBackup nilai lama: ${backupPath}`);

  const urlByFile = new Map();
  let done = 0;
  for (const file of needed) {
    const result = await cloudinary.uploader.upload(path.join(IMAGE_DIRECTORY, file), {
      public_id: publicIdFor(file),
      overwrite: true,
      resource_type: "image",
    });
    urlByFile.set(file, result.secure_url);
    done += 1;
    if (done % 10 === 0 || done === needed.size) console.log(`Upload ${done}/${needed.size}`);
  }
  const mapPath = path.join(REPORT_DIRECTORY, `image-map-${stamp}.json`);
  fs.writeFileSync(mapPath, JSON.stringify(Object.fromEntries(urlByFile), null, 2));

  const operations = plan.map(({ _id, next }) => ({
    updateOne: {
      filter: { _id },
      update: {
        $set: {
          image_url: next.map((item) =>
            typeof item === "string" ? item : urlByFile.get(item.file),
          ),
        },
      },
    },
  }));
  const result = await Soal.bulkWrite(operations);
  console.log(`Database diperbarui: ${result.modifiedCount} soal.`);
  console.log(`Peta file -> URL: ${mapPath}`);
  await mongoose.disconnect();
};

if (require.main === module) {
  main().catch(async (error) => {
    console.error("Migrasi gagal:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { createResolver, listImageFiles, publicIdFor };
