const User = require("../models/User");
const Jenjang = require("../models/Jenjang");
const mongoose = require("mongoose");
const {
  contextFromRequest,
  recordServerEvents,
} = require("../services/analyticsService");
const recordPersonalizationSaved = (req, wasProfileComplete, properties) =>
  recordServerEvents(contextFromRequest(req), [
    {
      name: "personalization_saved",
      properties: {
        ...properties,
        entry_context: wasProfileComplete ? "profile" : "onboarding",
      },
    },
  ]);

const setPersonalization = async (req, res) => {
  try {
    const { educationLevel: jenjangId, skipAllJenjang } = req.body;
    const userId = req.user.id;
    const previousUser = await User.findById(userId)
      .select("isProfileComplete")
      .lean();

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
      await recordPersonalizationSaved(req, previousUser?.isProfileComplete, {
        selected_jenjang: null,
        all_jenjang: true,
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

    let jenjang;
    if (mongoose.Types.ObjectId.isValid(jenjangId)) {
      jenjang = await Jenjang.findById(jenjangId);
    }
    if (!jenjang) {
      // Nama jenjang berupa enum (SD/SMP/SMA): cocokkan eksak, bukan regex dari input.
      jenjang = await Jenjang.findOne({ name: jenjangId.trim().toUpperCase() });
    }

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

    // ... sisanya tetap sama

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    await recordPersonalizationSaved(req, previousUser?.isProfileComplete, {
      selected_jenjang: jenjang.name,
      all_jenjang: false,
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
