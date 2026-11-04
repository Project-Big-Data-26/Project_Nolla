const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const REPOSITORY_ROOT = path.resolve(__dirname, "../..");
const IMAGE_DIRECTORIES = [
  path.join(REPOSITORY_ROOT, "frontend/src/assets"),
  path.join(REPOSITORY_ROOT, "backend/public/soal"),
];
const SOURCE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png"]);
const SOURCE_CODE_EXTENSIONS = new Set([".css", ".html", ".js", ".jsx", ".ts", ".tsx"]);

const listFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
};

const findImages = () =>
  IMAGE_DIRECTORIES.flatMap((directory) =>
    listFiles(directory).filter((filePath) =>
      SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
    ),
  );

const resolveReference = (sourceFile, reference) => {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (!cleanReference || cleanReference.startsWith("data:")) return null;

  if (cleanReference.startsWith("/")) {
    return path.resolve(REPOSITORY_ROOT, "frontend/public", cleanReference.slice(1));
  }
  if (!cleanReference.startsWith(".")) return null;
  return path.resolve(path.dirname(sourceFile), cleanReference);
};

const rewriteReferences = (source, sourceFile, webpByOriginalPath) =>
  source.replace(
    /(["'])([^"'\r\n]+\.(?:jpe?g|png)(?:[?#][^"']*)?)\1/gi,
    (match, quote, reference) => {
      const target = resolveReference(sourceFile, reference);
      const webpPath = target && webpByOriginalPath.get(path.normalize(target));
      if (!webpPath) return match;

      const suffixIndex = reference.search(/[?#]/);
      const suffix = suffixIndex < 0 ? "" : reference.slice(suffixIndex);
      const replacement =
        reference.slice(0, reference.length - suffix.length).replace(/\.(?:jpe?g|png)$/i, ".webp") +
        suffix;
      return `${quote}${replacement}${quote}`;
    },
  );

const convertImages = async ({ apply = false } = {}) => {
  const imagePaths = findImages();
  const webpByOriginalPath = new Map(
    imagePaths.map((imagePath) => [
      path.normalize(imagePath),
      path.normalize(imagePath.replace(/\.(?:jpe?g|png)$/i, ".webp")),
    ]),
  );
  const existingWebp = imagePaths.filter((imagePath) =>
    fs.existsSync(webpByOriginalPath.get(path.normalize(imagePath))),
  );

  console.log(`Mode: ${apply ? "APPLY" : "SIMULASI"}`);
  console.log(`File JPG/PNG ditemukan: ${imagePaths.length}`);
  console.log(`File WebP yang sudah ada: ${existingWebp.length}`);

  if (!apply) {
    console.log("Simulasi selesai. Tambahkan --apply untuk membuat WebP dan mengganti referensi.");
    return { converted: 0, referencesChanged: 0 };
  }

  let converted = 0;
  for (const imagePath of imagePaths) {
    const webpPath = webpByOriginalPath.get(path.normalize(imagePath));
    if (fs.existsSync(webpPath)) continue;

    await sharp(imagePath)
      .rotate()
      .webp({ quality: 82, effort: 5 })
      .toFile(webpPath);
    converted += 1;
    console.log(`Dikonversi: ${path.relative(REPOSITORY_ROOT, imagePath)}`);
  }

  let referencesChanged = 0;
  const sourceFiles = listFiles(path.join(REPOSITORY_ROOT, "frontend/src")).filter(
    (filePath) => SOURCE_CODE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );
  for (const sourceFile of sourceFiles) {
    const original = fs.readFileSync(sourceFile, "utf8");
    const updated = rewriteReferences(original, sourceFile, webpByOriginalPath);
    if (updated === original) continue;

    fs.writeFileSync(sourceFile, updated);
    referencesChanged += 1;
    console.log(`Referensi diperbarui: ${path.relative(REPOSITORY_ROOT, sourceFile)}`);
  }

  console.log(`File baru dikonversi: ${converted}`);
  console.log(`File sumber dengan referensi diperbarui: ${referencesChanged}`);
  console.log("File JPG/PNG asli dipertahankan sebagai cadangan.");
  return { converted, referencesChanged };
};

if (require.main === module) {
  convertImages({ apply: process.argv.includes("--apply") }).catch((error) => {
    console.error("Konversi gagal:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { convertImages, rewriteReferences };
