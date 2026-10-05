const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const IMAGE_DIRECTORY = path.resolve(__dirname, "../public/soal");
const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

const isImageFileName = (fileName) =>
  typeof fileName === "string" &&
  fileName.length > 0 &&
  !fileName.includes("\\") &&
  !fileName.startsWith("/") &&
  fileName
    .split("/")
    .every(
      (segment) =>
        segment && segment !== "." && segment !== ".." && !segment.includes(":"),
    ) &&
  IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());

const findImageFiles = async (directory, relativeDirectory = "") => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const imageFiles = [];

  for (const entry of entries) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      imageFiles.push(
        ...(await findImageFiles(path.join(directory, entry.name), relativePath)),
      );
    } else if (entry.isFile() && isImageFileName(relativePath)) {
      imageFiles.push(relativePath);
    }
  }

  return imageFiles;
};

const getQuestionImageToken = (fileName) => {
  const secret = process.env.IMAGE_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("IMAGE_TOKEN_SECRET atau JWT_SECRET wajib dikonfigurasi.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(fileName)
    .digest("hex")
    .slice(0, 32);
};

const toPublicImageUrls = (fileNames, req) => {
  if (!Array.isArray(fileNames)) return [];

  const baseUrl = (
    process.env.IMAGE_BASE_URL || `${req.protocol}://${req.get("host")}`
  ).replace(/\/+$/, "");

  return fileNames.flatMap((fileName) => {
    if (typeof fileName !== "string") return [];
    if (/^https?:\/\//i.test(fileName)) return [fileName];
    if (!isImageFileName(fileName)) return [];

    return [`${baseUrl}/image/${getQuestionImageToken(fileName)}`];
  });
};

const findQuestionImageByToken = async (token) => {
  if (!/^[a-f0-9]{32}$/i.test(token)) return null;

  try {
    const files = await findImageFiles(IMAGE_DIRECTORY);
    return (
      files.find(
        (fileName) => getQuestionImageToken(fileName) === token.toLowerCase(),
      ) || null
    );
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

module.exports = {
  IMAGE_DIRECTORY,
  findQuestionImageByToken,
  getQuestionImageToken,
  toPublicImageUrls,
};
