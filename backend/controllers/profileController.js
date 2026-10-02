const User = require("../models/User");
const Jenjang = require("../models/Jenjang");
const mongoose = require("mongoose");

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("jenjang_id");

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Profil berhasil diambil",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        jenjang_id: user.jenjang_id,
        allJenjang: user.allJenjang,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const { name, jenjang_id, allJenjang, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // Update nama
    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          message: "Nama tidak boleh kosong",
        });
      }

      user.name = trimmedName;
    }

    // Update jenjang
    if (allJenjang === true) {
      user.allJenjang = true;
      user.jenjang_id = null;
    } else if (jenjang_id !== undefined && jenjang_id !== null) {
      let jenjang;

      // Bisa menerima ObjectId
      if (mongoose.Types.ObjectId.isValid(jenjang_id)) {
        jenjang = await Jenjang.findById(jenjang_id);
      }

      // Bisa juga menerima "SD", "SMP", atau "SMA"
      if (!jenjang) {
        jenjang = await Jenjang.findOne({
          name: {
            $regex: new RegExp(`^${jenjang_id}$`, "i"),
          },
        });
      }

      if (!jenjang) {
        return res.status(400).json({
          message: "Jenjang tidak ditemukan",
        });
      }

      user.jenjang_id = jenjang._id;
      user.allJenjang = false;
    }

    // Update avatar
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    // Supaya response PATCH sama dengan GET
    await user.populate("jenjang_id");

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        jenjang_id: user.jenjang_id,
        allJenjang: user.allJenjang,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    // Misalnya avatar tidak termasuk enum
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Data profil tidak valid",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
