const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
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
 *         description: Email dan password wajib diisi
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

router.post("/verify-reset-otp", verifyResetOTP);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Mengubah password menggunakan OTP
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
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: siswa@example.com
 *               otp:
 *                 type: string
 *                 example: "839102"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: PasswordBaru123!
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: OTP salah atau kedaluwarsa
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);

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
