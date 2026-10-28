const User = require("../models/User");
const {
  resolveJenjang,
  snapshotPreference,
  preferenceChanged,
  recordPersonalizationSaved,
} = require("../services/personalizationPreferences");

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("jenjang_id");

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
        hasPassword: Boolean(user.password),
        updatedAt: user.updatedAt,
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
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Data profil tidak valid" });
    }
    const { name, jenjang_id, allJenjang, avatar } = req.body;
    if (
      (name !== undefined && typeof name !== "string") ||
      (allJenjang !== undefined && typeof allJenjang !== "boolean") ||
      (jenjang_id != null && typeof jenjang_id !== "string")
    ) {
      return res.status(400).json({ message: "Data profil tidak valid" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const previousPreference = snapshotPreference(user);
    let selectedJenjang = null;

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
      const jenjang = await resolveJenjang(jenjang_id);

      if (!jenjang) {
        return res.status(400).json({
          message: "Jenjang tidak ditemukan",
        });
      }

      user.jenjang_id = jenjang._id;
      user.allJenjang = false;
      selectedJenjang = jenjang.name;
    }

    // Update avatar
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    if (preferenceChanged(previousPreference, user)) {
      await recordPersonalizationSaved(req, {
        selectedJenjang,
        allJenjang: user.allJenjang === true,
        entryContext: "profile",
      });
    }

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
        hasPassword: Boolean(user.password),
        updatedAt: user.updatedAt,
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
