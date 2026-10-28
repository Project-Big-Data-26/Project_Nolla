const User = require("../models/User");
const {
  resolveJenjang,
  recordPersonalizationSaved,
} = require("../services/personalizationPreferences");

const setPersonalization = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        statusCode: 400, status: "error", message: "Data personalisasi tidak valid",
      });
    }
    const { educationLevel: jenjangId, skipAllJenjang } = req.body;
    if (skipAllJenjang !== undefined && typeof skipAllJenjang !== "boolean") {
      return res.status(400).json({
        statusCode: 400, status: "error", message: "skipAllJenjang harus berupa boolean",
      });
    }
    const userId = req.user.id;
    const previousUser = await User.findById(userId)
      .select("isProfileComplete")
      .lean();
    const entryContext = previousUser?.isProfileComplete ? "profile" : "onboarding";

    if (skipAllJenjang) {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          jenjang_id: null,
          allJenjang: true,
          isProfileComplete: true,
        },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "User tidak ditemukan",
        });
      }

      // Pilihan jenjang adalah preferensi, bukan bukti usia/kelas siswa.
      await recordPersonalizationSaved(req, {
        selectedJenjang: null,
        allJenjang: true,
        entryContext,
      });

      return res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Semua jenjang pendidikan berhasil dipilih",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isProfileComplete: user.isProfileComplete,
            allJenjang: user.allJenjang,
          },
        },
      });
    }

    if (!jenjangId) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "jenjangId wajib diisi",
      });
    }

    if (typeof jenjangId !== "string" || jenjangId.length > 32) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "jenjangId tidak valid",
      });
    }

    const jenjang = await resolveJenjang(jenjangId);

    if (!jenjang) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Jenjang tidak ditemukan",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        jenjang_id: jenjang._id,
        allJenjang: false,
        isProfileComplete: true,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    await recordPersonalizationSaved(req, {
      selectedJenjang: jenjang.name,
      allJenjang: false,
      entryContext,
    });

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Personalisasi berhasil disimpan",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isProfileComplete: user.isProfileComplete,
          jenjangId: user.jenjang_id,
        },
      },
    });
  } catch (error) {
    console.error("Set personalization error:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = { setPersonalization };
