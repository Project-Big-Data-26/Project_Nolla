const bcrypt = require("bcrypt");
const crypto = require("crypto");

const ms = require("ms");

const User = require("../models/User");
const OTP = require("../models/OTP");
const RefreshToken = require("../models/RefreshToken");
const RevokedToken = require("../models/RevokedToken");
const { sendOtp } = require("../services/otpService");

const googleOAuth2Client = require("../config/google");

const jwt = require("jsonwebtoken");

const {
  generateRefreshToken,
  hashRefreshToken,
} = require("../utils/refreshToken");

const { generateAccessToken } = require("../utils/generateAccessToken");
const passwordIsValid = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

const sendOtpError = (res, error) => {
  if (!error.statusCode) return false;

  if (error.retryAfterSeconds) {
    res.set("Retry-After", String(error.retryAfterSeconds));
  }

  res.status(error.statusCode).json({
    statusCode: error.statusCode,
    status: "error",
    message: error.message,
    retryAfterSeconds: error.retryAfterSeconds,
  });
  return true;
};

// ========================================
// HELPER
// ========================================

/**
 * Membuat refresh token baru,
 * menyimpan hash-nya ke database,
 * lalu mengembalikan raw refresh token.
 */
const createRefreshToken = async (user, options = {}) => {
  const rawRefreshToken = generateRefreshToken();

  const tokenHash = hashRefreshToken(rawRefreshToken);

  const refreshTokenDuration = ms(process.env.REFRESH_TOKEN_EXPIRES_IN || "1d");

  if (!refreshTokenDuration) {
    throw new Error("REFRESH_TOKEN_EXPIRES_IN tidak valid");
  }

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: options.expiresAt || new Date(Date.now() + refreshTokenDuration),
    rememberMe: options.rememberMe || false,
  });

  return rawRefreshToken;
};

const getAccessTokenExpiresIn = (expiresAt) => {
  const configuredDuration = ms(process.env.ACCESS_TOKEN_EXPIRES_IN || "15m");
  const remainingSessionSeconds =
    Math.floor(expiresAt.getTime() / 1000) - Math.floor(Date.now() / 1000);

  if (!configuredDuration || remainingSessionSeconds < 1) {
    throw new Error("Masa berlaku token tidak valid");
  }

  return Math.min(
    Math.floor(configuredDuration / 1000),
    remainingSessionSeconds,
  );
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

    if (!passwordIsValid(password)) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Password minimal 8 karakter dan harus memiliki huruf besar, huruf kecil, serta angka.",
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

    const otpResult = await sendOtp(normalizedEmail, "EMAIL_VERIFICATION");

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message:
        "Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi.",
      data: otpResult,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (sendOtpError(res, error)) return;

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
          allJenjang: user.allJenjang,
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
    const { email, password, rememberMe } = req.body;

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

    if (!user.isVerified) {
      return res.status(403).json({
        statusCode: 403,
        status: "error",
        code: "EMAIL_NOT_VERIFIED",
        message: "Email belum diverifikasi",
      });
    }

    const rememberSession = rememberMe === true;
    const durationConfig = rememberSession
      ? process.env.REMEMBER_ME_EXPIRES_IN || "30d"
      : process.env.REFRESH_TOKEN_EXPIRES_IN || "1d";
    const sessionDuration = ms(durationConfig);

    if (!sessionDuration) {
      throw new Error("Durasi sesi login tidak valid");
    }

    const sessionExpiresAt = new Date(Date.now() + sessionDuration);

    // Generate Access Token
    const accessToken = generateAccessToken(
      user,
      getAccessTokenExpiresIn(sessionExpiresAt),
    );

    // Generate Refresh Token
    const refreshToken = await createRefreshToken(user, {
      expiresAt: sessionExpiresAt,
      rememberMe: rememberSession,
    });

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
          allJenjang: user.allJenjang,
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

    const otpResult = await sendOtp(normalizedEmail, "PASSWORD_RESET");

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message:
        "Jika email terdaftar, kode OTP untuk reset password telah dikirim.",
      data: otpResult,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    if (sendOtpError(res, error)) return;

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// VERIFY RESET OTP (Khusus Cek OTP Lupa Password)
// POST /api/auth/verify-reset-otp
// ========================================
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email dan OTP wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cari OTP khusus PASSWORD_RESET
    const otpData = await OTP.findOne({
      email: normalizedEmail,
      otp,
      type: "PASSWORD_RESET",
    });

    if (!otpData) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP salah atau tidak ditemukan",
      });
    }

    // Cek Waktu Kedaluwarsa
    if (otpData.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpData._id });
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Kode OTP sudah kedaluwarsa",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Kode OTP valid",
      data: {
        resetToken: jwt.sign(
          { purpose: "password_reset", email: normalizedEmail, otpId: otpData._id },
          process.env.JWT_SECRET,
          { expiresIn: "10m" },
        ),
      },
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ========================================
// RESET PASSWORD
// POST /api/auth/change-password
// ========================================

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const resetToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : req.body.resetToken;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Token verifikasi dan password baru wajib diisi",
      });
    }

    if (!passwordIsValid(newPassword)) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Password minimal 8 karakter dan harus memiliki huruf besar, huruf kecil, serta angka.",
      });
    }

    let resetPayload;
    try {
      resetPayload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Token verifikasi tidak valid atau sudah kedaluwarsa",
      });
    }

    if (resetPayload.purpose !== "password_reset") {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Token verifikasi tidak valid",
      });
    }

    const otpData = await OTP.findOne({
      _id: resetPayload.otpId,
      email: resetPayload.email,
      type: "PASSWORD_RESET",
      expiresAt: { $gt: new Date() },
    });
    const user = await User.findOne({ email: resetPayload.email });

    if (!otpData || !user) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Token verifikasi tidak valid atau sudah kedaluwarsa",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const consumedOtp = await OTP.findOneAndDelete({
      _id: otpData._id,
      email: resetPayload.email,
      type: "PASSWORD_RESET",
      expiresAt: { $gt: new Date() },
    });

    if (!consumedOtp) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Token verifikasi tidak valid atau sudah digunakan",
      });
    }

    user.password = hashedPassword;
    await user.save();

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
    console.error("Change password error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || !["EMAIL_VERIFICATION", "PASSWORD_RESET"].includes(type)) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Email dan jenis OTP wajib diisi",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (type === "EMAIL_VERIFICATION" && (!user || user.isVerified)) {
      return res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "Akun tidak ditemukan atau email sudah diverifikasi",
      });
    }

    if (type === "PASSWORD_RESET" && !user) {
      return res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Jika email terdaftar, kode OTP untuk reset password telah dikirim.",
      });
    }

    const data = await sendOtp(normalizedEmail, type);
    return res.status(200).json({
      statusCode: 200,
      status: "success",
      message: "Kode OTP berhasil dikirim ulang",
      data,
    });
  } catch (error) {
    if (sendOtpError(res, error)) return;
    console.error("Resend OTP error:", error);
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
    const user = await User.findById(req.user.id).select(
      "_id name email jenjang_id role isProfileComplete isVerified allJenjang",
    );

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
      message: "Token valid",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          jenjangId: user.jenjang_id,
          isProfileComplete: user.isProfileComplete,
          isVerified: user.isVerified,
          allJenjang: user.allJenjang,
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
    const newAccessToken = generateAccessToken(
      user,
      getAccessTokenExpiresIn(storedToken.expiresAt),
    );

    // Buat Refresh Token baru
    const newRefreshToken = await createRefreshToken(user, {
      expiresAt: storedToken.expiresAt,
      rememberMe: storedToken.rememberMe,
    });

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

const googleLogin = async (req, res) => {
  try {
    // Generate PKCE verifier + challenge
    const { codeVerifier, codeChallenge } =
      await googleOAuth2Client.generateCodeVerifierAsync();

    // Generate state untuk mencegah CSRF
    const state = crypto.randomBytes(32).toString("hex");

    // Simpan verifier dan state sementara di cookie.
    // Nanti callback akan mengambil keduanya.
    res.cookie("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    });

    res.cookie("google_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    });

    const authorizationUrl = googleOAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google OAuth initialization error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Failed to initialize Google login",
    });
  }
};

const handleGoogleCallback = async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL;
  try {
    const { code, state } = req.query;
    const savedState = req.cookies.google_oauth_state;
    const codeVerifier = req.cookies.google_code_verifier;

    if (!code || !state || state !== savedState) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    // Tukar code -> token
    const { tokens } = await googleOAuth2Client.getToken({
      code,
      codeVerifier,
    });

    // Verifikasi ID token & ambil data user dari Google
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const normalizedEmail = payload.email.toLowerCase().trim();

    // Cari user, atau buat baru kalau belum ada
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: normalizedEmail,
        isVerified: true,
        isProfileComplete: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Google callback exchange error:", error);
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

const googleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  try {
    // Buat token JWT untuk user yang berhasil login via Google
    const accessToken = generateAccessToken(req.user); // sesuaikan dengan helper token di controller kalian
    const refreshToken = await createRefreshToken(req.user);

    const callbackUrl = new URL("/auth/google/callback", frontendUrl);
    callbackUrl.searchParams.set("accessToken", accessToken);
    callbackUrl.searchParams.set("refreshToken", refreshToken);

    return res.redirect(callbackUrl.toString());
  } catch (error) {
    console.error("Error Google Callback Controller:", error);
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
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
  verifyResetOTP,
  changePassword,
  resendOTP,
  getMe,
  refreshAccessToken,
  googleLogin,
  googleCallback,
  handleGoogleCallback,
};
