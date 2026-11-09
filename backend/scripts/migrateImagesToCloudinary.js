// Mengonversi gambar soal lokal ke WebP sebelum upload dan menyimpan URL hasilnya ke MongoDB.
// Simulasi (default): npm run migrate:images:cloudinary
// Terapkan: npm run migrate:images:cloudinary -- --apply --db <nama_db>
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const sharp = require("sharp");

const IMAGE_DIRECTORY = path.resolve(__dirname, "../public/soal");
const REPORT_DIRECTORY = path.resolve(__dirname, "../reports");
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "nolla/soal";
const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

const listImageFiles = (directory, relativeDirectory = "") => {
  if (!fs.existsSync(directory)) {
    console.warn(`Peringatan: Direktori ${directory} tidak ditemukan.`);
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
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
};

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

const uploadWebp = (cloudinary, filePath, publicId) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    sharp(filePath, { animated: true })
      .rotate()
      .webp({ quality: 82, effort: 5, animated: true })
      .toBuffer()
      .then((buffer) => upload.end(buffer))
      .catch(reject);
  });

const parseFlags = (argv) => {
  const dbIndex = argv.indexOf("--db");
  return {
    apply: argv.includes("--apply"),
    db: dbIndex === -1 ? null : argv[dbIndex + 1] || null,
  };
};

const main = async () => {
  const { apply, db } = parseFlags(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diisi.");

  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.name;
  const files = listImageFiles(IMAGE_DIRECTORY);
  const resolve = createResolver(files);
  console.log(
    `Mode: ${apply ? "APPLY (mengubah data)" : "SIMULASI (tidak mengubah apa pun)"}`,
  );
  console.log(`Database: ${dbName}`);
  console.log(`File gambar di disk: ${files.length}`);

  if (apply && db !== dbName) {
    throw new Error(
      `--apply harus disertai --db ${dbName} (nama database yang tersambung). Nilai --db sekarang: ${db ?? "(kosong)"}.`,
    );
  }

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
  console.log(
    `File di disk yang tidak dipakai soal mana pun: ${files.length - needed.size}`,
  );

  if (unmatched.size) {
    console.log(
      `\nPERINGATAN: ${unmatched.size} nilai image_url tidak cocok dengan file di disk:`,
    );
    [...unmatched].slice(0, 20).forEach((value) => console.log(`  - ${value}`));
  }

  if (!apply) {
    if (resume)
      throw new Error("--resume hanya dapat digunakan bersama --apply.");
    console.log(
      "\nSimulasi selesai. Jalankan dengan --apply untuk upload dan update database.",
    );
    await mongoose.disconnect();
    return;
  }

  for (const key of [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ]) {
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
  let checkpointPath = resume ? path.resolve(resume) : null;
  let checkpoint;
  let stamp;
  if (checkpointPath) {
    checkpoint = readCheckpoint(checkpointPath);
    const { metadata } = checkpoint;
    if (
      metadata.dbName !== dbName ||
      metadata.cloudName !== process.env.CLOUDINARY_CLOUD_NAME ||
      metadata.folder !== CLOUDINARY_FOLDER
    ) {
      throw new Error(
        "Checkpoint dibuat untuk database atau konfigurasi Cloudinary yang berbeda.",
      );
    }
    if (
      typeof metadata.stamp !== "string" ||
      typeof metadata.backupPath !== "string" ||
      !Array.isArray(metadata.neededFiles) ||
      !metadata.fingerprints ||
      typeof metadata.fingerprints !== "object"
    ) {
      throw new Error("Metadata checkpoint tidak lengkap.");
    }
    const checkpointFiles = new Set(metadata.neededFiles);
    for (const file of needed) {
      const expected = metadata.fingerprints[file];
      if (!checkpointFiles.has(file) || !expected) {
        throw new Error(
          `File ${file} tidak tercatat di checkpoint. Jalankan migrasi baru.`,
        );
      }
      const current = fs.statSync(path.join(IMAGE_DIRECTORY, file));
      if (
        current.size !== expected.size ||
        current.mtimeMs !== expected.mtimeMs
      ) {
        throw new Error(`File sumber berubah sejak checkpoint dibuat: ${file}`);
      }
    }
    if (!fs.existsSync(metadata.backupPath)) {
      throw new Error(
        `File backup checkpoint tidak ditemukan: ${metadata.backupPath}`,
      );
    }
    stamp = metadata.stamp;
    console.log(`\nMelanjutkan dari checkpoint: ${checkpointPath}`);
    console.log(`Backup nilai lama: ${metadata.backupPath}`);
    console.log(
      `Upload sudah tersimpan: ${[...needed].filter((file) => checkpoint.uploaded.has(file)).length}/${needed.size}`,
    );
    console.log(
      `Jika gagal lagi, lanjutkan dengan: npm run migrate:images:cloudinary -- --apply --db ${dbName} --resume "${checkpointPath}"`,
    );
  } else {
    stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(
      REPORT_DIRECTORY,
      `image-url-backup-${stamp}.json`,
    );
    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        plan.map(({ _id, original }) => ({ _id, image_url: original })),
        null,
        2,
      ),
    );
    const fingerprints = Object.fromEntries(
      [...needed].map((file) => {
        const { size, mtimeMs } = fs.statSync(path.join(IMAGE_DIRECTORY, file));
        return [file, { size, mtimeMs }];
      }),
    );
    const metadata = {
      type: "metadata",
      version: 1,
      stamp,
      dbName,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: CLOUDINARY_FOLDER,
      neededFiles: [...needed],
      fingerprints,
      backupPath,
    };
    checkpointPath = path.join(
      REPORT_DIRECTORY,
      `image-migration-checkpoint-${stamp}.jsonl`,
    );
    fs.writeFileSync(checkpointPath, `${JSON.stringify(metadata)}\n`);
    checkpoint = { metadata, uploaded: new Map() };
    console.log(`\nBackup nilai lama disimpan di: ${backupPath}`);
    console.log(`Checkpoint progres upload: ${checkpointPath}`);
    console.log(
      `Jika gagal, lanjutkan dengan: npm run migrate:images:cloudinary -- --apply --db ${dbName} --resume "${checkpointPath}"`,
    );
  }

  const urlByFile = checkpoint.uploaded;
  let done = 0;
  for (const file of needed) {
    const result = await uploadWebp(
      cloudinary,
      path.join(IMAGE_DIRECTORY, file),
      publicIdFor(file),
    );
    urlByFile.set(file, result.secure_url);
    appendCheckpointEntry(checkpointPath, file, result.secure_url);
    done += 1;
    if (done % 10 === 0 || done === needed.size)
      console.log(`Upload ${done}/${needed.size}`);
  }
  const mapPath = path.join(REPORT_DIRECTORY, `image-map-${stamp}.json`);
  const urlsForPlan = Object.fromEntries(
    [...needed].map((file) => [file, urlByFile.get(file)]),
  );
  fs.writeFileSync(mapPath, JSON.stringify(urlsForPlan, null, 2));

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

  if (operations.length > 0) {
    const result = await Soal.bulkWrite(operations);
    console.log(`Database diperbarui: ${result.modifiedCount} soal.`);
  } else {
    console.log("Tidak ada dokumen yang perlu diperbarui.");
  }

  console.log(`Peta file -> URL: ${mapPath}`);
  fs.unlinkSync(checkpointPath);
  console.log("Checkpoint selesai dan dihapus.");
  await mongoose.disconnect();
};

if (require.main === module) {
  main().catch(async (error) => {
    console.error("Migrasi gagal:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = {
  createResolver,
  listImageFiles,
  publicIdFor,
  parseCheckpointContents,
};
