const bcrypt = require("bcrypt");
const ms = require("ms");

const User = require("../models/User");
const OTP = require("../models/OTP");
const RefreshToken = require("../models/RefreshToken");
const RevokedToken = require("../models/RevokedToken");

const jwt = require("jsonwebtoken");

const {
  generateRefreshToken,
  hashRefreshToken,
} = require("../utils/refreshToken");

const { generateAccessToken } = require("../utils/generateAccessToken");
const generateOTP = require("../utils/generateOTP");

const {
  sendOTPEmail,
  sendPasswordResetOTPEmail,
} = require("../services/emailService");

// ========================================
// HELPER
// ========================================

/**
 * Membuat refresh token baru,
 * menyimpan hash-nya ke database,
 * lalu mengembalikan raw refresh token.
 */
const createRefreshToken = async (user) => {
  const rawRefreshToken = generateRefreshToken();

  const tokenHash = hashRefreshToken(rawRefreshToken);

  const refreshTokenDuration = ms(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");

  if (!refreshTokenDuration) {
    throw new Error("REFRESH_TOKEN_EXPIRES_IN tidak valid");
  }

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + refreshTokenDuration),
  });

  return rawRefreshToken;
};

// ========================================
// REGISTER
// POST /api/auth/register
// ========================================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Name, email, dan password wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email sudah terdaftar",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      isProfileComplete: false,
    });

    // Generate OTP
    const otpCode = generateOTP();

    // Simpan OTP
    await OTP.create({
      email: normalizedEmail,
      otp: otpCode,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Kirim OTP melalui email
    await sendOTPEmail(normalizedEmail, otpCode);

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message:
        "Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi.",
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// VERIFY EMAIL
// POST /api/auth/verify-email
// ========================================

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validasi input
    if (!email || !otp) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email dan OTP wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cari user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    // Cari OTP
    const otpData = await OTP.findOne({
      email: normalizedEmail,
      otp,
      type: "EMAIL_VERIFICATION",
    });

    if (!otpData) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP salah atau sudah kedaluwarsa",
      });
    }

    // Cek expiry
    if (otpData.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpData._id,
      });

      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP salah atau sudah kedaluwarsa",
      });
    }

    // Verifikasi user
    user.isVerified = true;

    await user.save();

    // OTP sudah digunakan → hapus
    await OTP.deleteOne({
      _id: otpData._id,
    });

    // Generate Access Token
    const accessToken = generateAccessToken(user);

    // Generate Refresh Token
    const refreshToken = await createRefreshToken(user);

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Email berhasil diverifikasi",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isProfileComplete: user.isProfileComplete,
        },
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// LOGIN
// POST /api/auth/login
// ========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email dan password wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cari user berdasarkan email
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Email atau password salah",
      });
    }

    // User Google bisa saja tidak memiliki password
    if (!user.password) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Email atau password salah",
      });
    }

    // Cocokkan password dengan hash di database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Email atau password salah",
      });
    }

    // Cek apakah email sudah diverifikasi
    if (!user.isVerified) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Email belum diverifikasi",
      });
    }

    // Generate Access Token
    const accessToken = generateAccessToken(user);

    // Generate Refresh Token
    const refreshToken = await createRefreshToken(user);

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Login berhasil",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isProfileComplete: user.isProfileComplete,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// LOGOUT
// POST /api/auth/logout
// ========================================

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // ========================================
    // VALIDASI REFRESH TOKEN
    // ========================================

    if (!refreshToken) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Refresh token wajib diisi",
      });
    }

    // ========================================
    // AMBIL ACCESS TOKEN
    // ========================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Access token tidak ditemukan",
      });
    }

    const accessToken = authHeader.split(" ")[1];

    // ========================================
    // VALIDASI ACCESS TOKEN
    // ========================================

    let decodedAccessToken;

    try {
      decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Access token tidak valid atau sudah kedaluwarsa",
      });
    }

    // ========================================
    // CEK ACCESS TOKEN MILIK USER
    // ========================================

    if (decodedAccessToken.id !== req.user.id) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Access token tidak sesuai dengan user",
      });
    }

    // ========================================
    // REVOKE ACCESS TOKEN
    // ========================================

    if (decodedAccessToken.exp) {
      await RevokedToken.findOneAndUpdate(
        {
          token: accessToken,
        },
        {
          token: accessToken,
          expiresAt: new Date(decodedAccessToken.exp * 1000),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    // ========================================
    // REVOKE REFRESH TOKEN
    // ========================================

    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await RefreshToken.findOne({
      tokenHash,
      userId: req.user.id,
      revokedAt: null,
    });

    if (storedToken) {
      storedToken.revokedAt = new Date();
      await storedToken.save();
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ========================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Untuk keamanan, response tetap sama
     * walaupun email tidak ditemukan.
     */
    if (!user) {
      return res.status(200).json({
        statusCode: 200,
        status: "success",
        message:
          "Jika email terdaftar, kode OTP untuk reset password telah dikirim.",
      });
    }

    // Hapus OTP reset password sebelumnya
    await OTP.deleteMany({
      email: normalizedEmail,
      type: "PASSWORD_RESET",
    });

    // Generate OTP baru
    const otpCode = generateOTP();

    // Simpan OTP selama 15 menit
    await OTP.create({
      email: normalizedEmail,
      otp: otpCode,
      type: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Kirim OTP ke email
    await sendPasswordResetOTPEmail(normalizedEmail, otpCode);

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message:
        "Jika email terdaftar, kode OTP untuk reset password telah dikirim.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ========================================

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email, OTP, dan password baru wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cari user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP salah atau sudah kedaluwarsa",
      });
    }

    // Cari OTP reset password
    const otpData = await OTP.findOne({
      email: normalizedEmail,
      otp,
      type: "PASSWORD_RESET",
    });

    if (!otpData) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP salah atau sudah kedaluwarsa",
      });
    }

    // Cek expiry
    if (otpData.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpData._id,
      });

      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP salah atau sudah kedaluwarsa",
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;

    await user.save();

    // OTP tidak boleh digunakan lagi
    await OTP.deleteOne({
      _id: otpData._id,
    });

    // Revoke semua refresh token aktif
    // agar session lama tidak dapat digunakan lagi
    await RefreshToken.updateMany(
      {
        userId: user._id,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      },
    );

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// GET ME
// GET /api/auth/me
// ========================================

const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Token valid",
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh
// ========================================

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Refresh token tidak ditemukan",
      });
    }

    // Hash refresh token dari request
    const tokenHash = hashRefreshToken(refreshToken);

    // Cari refresh token di database
    const storedToken = await RefreshToken.findOne({
      tokenHash,
    });

    if (!storedToken) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Refresh token tidak valid",
      });
    }

    // Cek apakah token sudah dicabut
    if (storedToken.revokedAt) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Refresh token sudah tidak berlaku",
      });
    }

    // Cek expiry
    if (storedToken.expiresAt <= new Date()) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Refresh token sudah kedaluwarsa",
      });
    }

    // Cari user pemilik refresh token
    const user = await User.findById(storedToken.userId);

    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    // ========================================
    // ROTATE REFRESH TOKEN
    // ========================================

    // Cabut refresh token lama
    storedToken.revokedAt = new Date();

    await storedToken.save();

    // Buat Access Token baru
    const newAccessToken = generateAccessToken(user);

    // Buat Refresh Token baru
    const newRefreshToken = await createRefreshToken(user);

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Token berhasil diperbarui",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  refreshAccessToken,
};
