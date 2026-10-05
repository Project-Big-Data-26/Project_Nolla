const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  verifyResetOTP,
  changePassword,
  updateOwnPassword,
  resendOTP,
  getOtpResendStatus,
  getMe,
  refreshAccessToken,
  googleLogin,
  googleCallback,
  handleGoogleCallback,
} = require("../controllers/authController");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrasi user baru
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Budi Santoso
 *               email:
 *                 type: string
 *                 format: email
 *                 example: siswa@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Registrasi berhasil
 *       400:
 *         description: Email sudah terdaftar atau input tidak valid
 *       500:
 *         description: Server error
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verifikasi email menggunakan OTP
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: siswa@example.com
 *               otp:
 *                 type: string
 *                 example: "482910"
 *     responses:
 *       200:
 *         description: Email berhasil diverifikasi
 *       400:
 *         description: OTP salah atau sudah kedaluwarsa
 *       500:
 *         description: Server error
 */
router.post("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login menggunakan email dan password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: siswa@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login berhasil
 *       400:
 *         description: Body harus berupa objek JSON dengan email dan password berupa teks yang tidak kosong; rememberMe jika dikirim harus boolean
 *       401:
 *         description: Email atau password salah atau email belum diverifikasi
 *       500:
 *         description: Server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user dan mencabut token aktif
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 8f3a9d7c2e1b4a5f6d...
 *     responses:
 *       200:
 *         description: Logout berhasil dan token telah dicabut
 *       401:
 *         description: Token tidak valid
 *       500:
 *         description: Server error
 */
router.post("/logout", authMiddleware, logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Meminta OTP untuk reset password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: siswa@example.com
 *     responses:
 *       200:
 *         description: OTP reset password telah dikirim
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Mengirim ulang OTP dengan cooldown bersama
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [EMAIL_VERIFICATION, PASSWORD_RESET]
 *     responses:
 *       200:
 *         description: OTP berhasil dikirim
 *       429:
 *         description: Cooldown pengiriman OTP masih aktif
 */
router.post("/send-otp", resendOTP);

/**
 * @swagger
 * /api/auth/otp-resend-status:
 *   post:
 *     summary: Mendapatkan sisa waktu sebelum OTP dapat dikirim ulang
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [EMAIL_VERIFICATION, PASSWORD_RESET]
 *     responses:
 *       200:
 *         description: Status cooldown berhasil diambil
 *       400:
 *         description: Email atau jenis OTP tidak valid
 *       500:
 *         description: Server error
 */
router.post("/otp-resend-status", getOtpResendStatus);

router.post("/verify-reset-otp", verifyResetOTP);
router.post("/verify-otp", verifyResetOTP);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Mengubah password menggunakan token hasil verifikasi OTP
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: PasswordBaru123!
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: Token verifikasi tidak valid atau kedaluwarsa
 *       500:
 *         description: Server error
 */
router.post("/change-password", changePassword);

/**
 * @swagger
 * /api/auth/password:
 *   patch:
 *     summary: Mengganti password user yang sedang login
 *     description: Mengganti password akun. Password lama wajib untuk akun yang sudah memiliki password; opsional untuk akun tanpa password.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Bigdata2026
 *               newPassword:
 *                 type: string
 *                 example: Nolla2026
 *               confirmPassword:
 *                 type: string
 *                 example: Nolla2026
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: Input tidak valid atau password lama salah
 *       401:
 *         description: Access token tidak valid atau tidak ditemukan
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.patch("/password", authMiddleware, updateOwnPassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Memperbarui access token menggunakan refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 8f3a9d7c2e1b4a5f6d...
 *     responses:
 *       200:
 *         description: Token berhasil diperbarui
 *       401:
 *         description: Refresh token tidak valid
 *       500:
 *         description: Server error
 */
router.post("/refresh", refreshAccessToken);

// Rute Google OAuth
router.get("/google", googleLogin);
router.get("/google/callback", handleGoogleCallback, googleCallback);
// Cek user aktif
router.get("/me", authMiddleware, getMe);

module.exports = router;
