const mongoose = require("mongoose");
const AssessmentFeedback = require("../models/AssessmentFeedback");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MengerjakanPretest = require("../models/MengerjakanPretest");

const submitAssessmentFeedback = async (req, res) => {
  const { assessment_type: assessmentType, attempt_id: attemptId, rating } =
    req.body || {};
  const comment = req.body?.comment ?? "";

  if (!["quiz", "pretest"].includes(assessmentType)) {
    return res.status(400).json({
      success: false,
      message: "Jenis latihan tidak valid.",
    });
  }

  if (
    typeof attemptId !== "string" ||
    !/^[a-f\d]{24}$/i.test(attemptId) ||
    !mongoose.Types.ObjectId.isValid(attemptId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Sesi latihan tidak valid.",
    });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Penilaian harus berupa 1 sampai 5 bintang.",
    });
  }

  if (typeof comment !== "string" || comment.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Saran maksimal 500 karakter.",
    });
  }

  try {
    const AttemptModel =
      assessmentType === "pretest" ? MengerjakanPretest : MengerjakanKuis;
    const attempt = await AttemptModel.findOne({
      _id: attemptId,
      user_id: req.user.id,
      completed_at: { $ne: null },
    })
      .select("_id")
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Sesi latihan selesai tidak ditemukan.",
      });
    }

    const feedback = await AssessmentFeedback.create({
      user_id: req.user.id,
      assessment_type: assessmentType,
      attempt_id: attempt._id,
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Masukan berhasil dikirim. Terima kasih!",
      data: { id: feedback._id },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Masukan untuk sesi latihan ini sudah pernah dikirim.",
      });
    }

    console.error("Submit assessment feedback error:", error);
    return res.status(500).json({
      success: false,
      message: "Masukan gagal disimpan. Silakan coba lagi.",
    });
  }
};

module.exports = { submitAssessmentFeedback };
