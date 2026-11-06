const path = require("node:path");

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

const getFolder = (folder = process.env.CLOUDINARY_FOLDER || "nolla/soal") =>
  folder.replace(/^\/+|\/+$/g, "");

const toPublicId = (value, folder) => {
  if (typeof value !== "string") return null;

  const cleaned = value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(?:backend\/)?(?:public\/)?soal\//, "");
  const ext = path.posix.extname(cleaned).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) return null;

  const relativePath = cleaned.slice(0, -ext.length);
  const segments = relativePath.split("/");
  if (
    !relativePath ||
    segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes(":"))
  ) {
    return null;
  }

  const configuredFolder = getFolder(folder);
  const publicId = relativePath.startsWith(`${configuredFolder}/`)
    ? relativePath
    : `${configuredFolder}/${relativePath}`;

  return { publicId, ext };
};

const toCloudinaryUrl = (
  cloudName,
  value,
  {
    folder,
    deliveryBase = process.env.CLOUDINARY_DELIVERY_URL || "https://res.cloudinary.com",
  } = {},
) => {
  if (typeof cloudName !== "string" || !/^[A-Za-z0-9_-]+$/.test(cloudName)) {
    return null;
  }

  const parsed = toPublicId(value, folder);
  if (!parsed) return null;

  const base = deliveryBase.replace(/\/+$/, "");
  const encodedPublicId = parsed.publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/${cloudName}/image/upload/f_webp,q_auto/${encodedPublicId}.webp`;
};

module.exports = { toCloudinaryUrl, toPublicId };
