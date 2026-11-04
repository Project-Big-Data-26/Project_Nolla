require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const sharp = require("sharp");
const { toPublicId } = require("../utils/cloudinaryImage");

const REPORT_DIRECTORY = path.resolve(__dirname, "../reports");
const CONVERTIBLE_EXTENSIONS = new Set([".avif", ".jpeg", ".jpg", ".png"]);

const parseArgs = (argv) => {
  const index = argv.indexOf("--db");
  return {
    apply: argv.includes("--apply"),
    db: index === -1 ? null : argv[index + 1] || null,
  };
};

const parseCloudinaryImageUrl = (value, cloudName) => {
  if (typeof value !== "string") return null;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.hostname !== "res.cloudinary.com" ||
    !/^[A-Za-z0-9_-]+$/.test(cloudName || "") ||
    !url.pathname.startsWith(`/${cloudName}/image/upload/`)
  ) {
    return null;
  }

  const resourcePath = url.pathname.split("/image/upload/")[1];
  const segments = resourcePath.split("/").filter(Boolean);
  while (segments.length && (segments[0].includes(",") || /^v\d+$/.test(segments[0]))) {
    segments.shift();
  }
  if (!segments.length) return null;

  const lastSegment = segments.pop();
  const ext = path.posix.extname(lastSegment).toLowerCase();
  const fileStem = lastSegment.slice(0, -ext.length);
  if (
    !CONVERTIBLE_EXTENSIONS.has(ext) ||
    !fileStem ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    return null;
  }

  const publicId = [...segments, fileStem].join("/");
  return { publicId, ext };
};

const sourceUrlFor = (value, cloudName) => {
  const parsedUrl = parseCloudinaryImageUrl(value, cloudName);
  if (parsedUrl) return value;
  if (typeof value !== "string" || /^https?:\/\//i.test(value)) return null;

  const folder =
    process.env.CLOUDINARY_FOLDER === undefined
      ? "nolla/soal"
      : process.env.CLOUDINARY_FOLDER;
  const parsed = toPublicId(value, folder);
  if (!parsed) return null;

  const publicId = parsed.publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}${parsed.ext}`;
};

const uploadBuffer = (cloudinary, buffer, publicId) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: false, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    upload.end(buffer);
  });

const main = async () => {
  const { apply, db } = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diisi.");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME belum diisi.");

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const dbName = mongoose.connection.name;
  console.log(`Mode     : ${apply ? "APPLY" : "SIMULASI (hanya membaca)"}`);
  console.log(`Database : ${dbName}`);

  if (apply && db !== dbName) {
    throw new Error(
      `--apply harus disertai --db ${dbName} (nama database yang tersambung). Nilai --db sekarang: ${db ?? "(kosong)"}.`,
    );
  }

  const Soal = require("../models/Soal");
  const soalList = await Soal.find({ "image_url.0": { $exists: true } })
    .select("image_url")
    .lean();
  const plan = [];
  const urls = new Set();
  const sourceUrlByStoredValue = new Map();

  for (const soal of soalList) {
    const converted = soal.image_url.map((value) => {
      const sourceUrl = sourceUrlFor(value, cloudName);
      const parsed = parseCloudinaryImageUrl(sourceUrl, cloudName);
      if (parsed) sourceUrlByStoredValue.set(value, sourceUrl);
      return { value, sourceUrl, parsed };
    }).filter(({ parsed }) => parsed);
    if (!converted.length) continue;

    converted.forEach(({ sourceUrl }) => urls.add(sourceUrl));
    plan.push({ _id: soal._id, original: soal.image_url });
  }

  console.log(`Soal yang diperiksa: ${soalList.length}`);
  console.log(`URL Cloudinary JPG/PNG/AVIF yang akan dikonversi: ${urls.size}`);
  console.log(`Dokumen soal terkait: ${plan.length}`);

  if (!apply) {
    console.log("Simulasi selesai. Tambahkan --apply --db <nama_db> untuk mengunggah WebP dan memperbarui DB.");
    await mongoose.disconnect();
    return;
  }

  for (const key of ["CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
    if (!process.env[key]) throw new Error(`${key} belum diisi.`);
  }
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(REPORT_DIRECTORY, `webp-image-url-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(plan.map(({ _id, original }) => ({ _id, image_url: original })), null, 2),
  );
  console.log(`Backup nilai lama: ${backupPath}`);

  const newUrlByOldUrl = new Map();
  for (const oldUrl of urls) {
    const { publicId } = parseCloudinaryImageUrl(oldUrl, cloudName);
    const response = await fetch(oldUrl);
    if (!response.ok) {
      throw new Error(`Gagal mengunduh aset Cloudinary (${response.status}): ${oldUrl}`);
    }

    const source = Buffer.from(await response.arrayBuffer());
    const webp = await sharp(source, { animated: true })
      .rotate()
      .webp({ quality: 82, effort: 5, animated: true })
      .toBuffer();
    const result = await uploadBuffer(cloudinary, webp, `${publicId}-webp`);
    newUrlByOldUrl.set(oldUrl, result.secure_url);
    console.log(`WebP diunggah: ${publicId}-webp`);
  }

  const result = await Soal.bulkWrite(
    plan.map(({ _id, original }) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            image_url: original.map((value) => {
              const sourceUrl = sourceUrlByStoredValue.get(value);
              return (sourceUrl && newUrlByOldUrl.get(sourceUrl)) ?? value;
            }),
          },
        },
      },
    })),
  );
  console.log(`Database diperbarui: ${result.modifiedCount} soal.`);
  console.log("Aset lama di Cloudinary tidak dihapus; verifikasi dahulu sebelum pembersihan.");
  await mongoose.disconnect();
};

if (require.main === module) {
  main().catch(async (error) => {
    console.error("Konversi Cloudinary gagal:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { parseCloudinaryImageUrl, sourceUrlFor };
