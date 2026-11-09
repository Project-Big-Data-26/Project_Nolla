const { randomUUID } = require("node:crypto");
const cloudinary = require("cloudinary").v2;

const getComplaintImageConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Konfigurasi Cloudinary belum lengkap di environment backend.");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return {
    folder: (process.env.CLOUDINARY_COMPLAINTS_FOLDER || "nolla/complaints").replace(/^\/+|\/+$/g, ""),
  };
};

const hasAllowedImageSignature = (buffer, mimeType) => {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") {
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

const uploadComplaintImage = (file) => {
  const { folder } = getComplaintImageConfig();
  if (!hasAllowedImageSignature(file.buffer, file.mimetype)) {
    const error = new Error("Isi file tidak cocok dengan format PNG, JPG, atau WEBP.");
    error.status = 400;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: randomUUID(),
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    upload.end(file.buffer);
  });
};

const deleteComplaintImage = async (publicId) => {
  if (!publicId) return;
  getComplaintImageConfig();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = { uploadComplaintImage, deleteComplaintImage };
