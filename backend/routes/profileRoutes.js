const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

const router = express.Router();


// SWAGGER GET PROFILE
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Mengambil profil user yang sedang login
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil berhasil diambil
 *       401:
 *         description: Token tidak valid atau sudah kedaluwarsa
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/", authMiddleware, getProfile);


// SWAGGER UPDATE PROFILE
/**
 * @swagger
 * /api/profile:
 *   patch:
 *     summary: Memperbarui profil user
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Prita Aulia
 *               jenjang_id:
 *                 type: string
 *                 example: SMP
 *               allJenjang:
 *                 type: boolean
 *                 example: false
 *               avatar:
 *                 type: string
 *                 example: avatar_2
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *       400:
 *         description: Data profil tidak valid
 *       401:
 *         description: Token tidak valid atau sudah kedaluwarsa
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Server error
 */
router.patch("/", authMiddleware, updateProfile);

module.exports = router;