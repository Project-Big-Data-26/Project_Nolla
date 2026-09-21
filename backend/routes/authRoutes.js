const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  refreshAccessToken,
  googleLogin,
  googleCallback,
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
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               status: success
 *               message: Login berhasil
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: 8f3a9d...
 *                 user:
 *                   id: 65f123456789abcdef123456
 *                   name: Budi Santoso
 *                   email: siswa@example.com
 *                   isProfileComplete: false
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
 *     description: >
 *       Logout membutuhkan access token pada Authorization header dan
 *       refresh token pada request body. Access token akan dimasukkan ke
 *       revoked token sehingga tidak dapat digunakan lagi, sedangkan
 *       refresh token akan dicabut dari database.
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
 *                 description: Refresh token yang sedang digunakan oleh user
 *                 example: 8f3a9d7c2e1b4a5f6d...
 *     responses:
 *       200:
 *         description: Logout berhasil dan token telah dicabut
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               status: success
 *               message: Logout berhasil
 *       400:
 *         description: Refresh token wajib diisi
 *       401:
 *         description: Access token tidak ditemukan, tidak valid, atau tidak sesuai dengan user
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
 *         description: Jika email terdaftar, OTP reset password telah dikirim
 *       400:
 *         description: Email wajib diisi
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", forgotPassword);

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
 *         description: OTP salah atau sudah kedaluwarsa
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Memperbarui access token menggunakan refresh token
 *     description: >
 *       Digunakan ketika access token sudah kedaluwarsa. Refresh token akan
 *       divalidasi di database. Jika valid, refresh token lama akan dicabut
 *       dan sistem akan menerbitkan access token dan refresh token baru
 *       (refresh token rotation).
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
 *                 description: Refresh token aktif milik user
 *                 example: 8f3a9d7c2e1b4a5f6d...
 *     responses:
 *       200:
 *         description: Token berhasil diperbarui
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 200
 *               status: success
 *               message: Token berhasil diperbarui
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: 9a4b7c...
 *       401:
 *         description: Refresh token tidak valid, sudah dicabut, atau sudah kedaluwarsa
 *       500:
 *         description: Server error
 */
router.post("/refresh", refreshAccessToken);

router.get("/google", googleLogin);

router.get("/google/callback", googleCallback);

// test login backend doang
router.get("/me", authMiddleware, getMe);

module.exports = router;
