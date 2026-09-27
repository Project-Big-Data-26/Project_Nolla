const User = require("../models/User");
const Jenjang = require("../models/Jenjang");
const mongoose = require("mongoose");
const setPersonalization = async (req, res) => {
  try {
    const { educationLevel: jenjangId } = req.body;
    const userId = req.user.id;
    // ... sisanya tetap sama
    if (!jenjangId) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "jenjangId wajib diisi",
      });
    }

    let jenjang;
    if (mongoose.Types.ObjectId.isValid(jenjangId)) {
      jenjang = await Jenjang.findById(jenjangId);
    }
    if (!jenjang) {
      jenjang = await Jenjang.findOne({
        name: { $regex: new RegExp(`^${jenjangId}$`, "i") },
      });
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
