const Complaint = require("../models/Complaint");
const { COMPLAINT_TYPES } = require("../models/Complaint");
const { uploadComplaintImage, deleteComplaintImage } = require("../utils/complaintImage");

const createComplaint = async (req, res) => {
  const { email, type, subject, description } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
  const normalizedDescription = typeof description === "string" ? description.trim() : "";

  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    !COMPLAINT_TYPES.includes(type) ||
    normalizedSubject.length < 4 || normalizedSubject.length > 120 ||
    normalizedDescription.length < 10 || normalizedDescription.length > 2000
  ) {
    return res.status(400).json({
      success: false,
      message: "Data pengaduan tidak valid. Periksa kembali isian form.",
    });
  }

  let uploadedAttachment = null;
  try {
    uploadedAttachment = req.file ? await uploadComplaintImage(req.file) : null;
    const complaint = await Complaint.create({
      email: normalizedEmail,
      type,
      subject: normalizedSubject,
      description: normalizedDescription,
      ...(uploadedAttachment ? { attachment: uploadedAttachment } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Pengaduan berhasil dikirim.",
      data: {
        id: complaint._id,
        status: complaint.status,
        created_at: complaint.created_at,
        has_attachment: Boolean(complaint.attachment?.public_id),
      },
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    if (uploadedAttachment?.public_id) {
      try {
        await deleteComplaintImage(uploadedAttachment.public_id);
      } catch (cleanupError) {
        console.error("Delete orphan complaint image error:", cleanupError);
      }
    }
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Pengaduan gagal dikirim. Periksa konfigurasi penyimpanan gambar atau coba lagi.",
    });
  }
};

module.exports = { createComplaint };
