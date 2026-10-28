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
 *         description: Profil berhasil diambil, termasuk indikator hasPassword dan waktu updatedAt dari server
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
 *                 nullable: true
 *                 example: SMP
 *               allJenjang:
 *                 type: boolean
 *                 example: false
 *               avatar:
 *                 type: string
 *                 enum: [avatar_1, avatar_2, avatar_3, avatar_4, avatar_5, avatar_6, avatar_7, avatar_8]
 *                 example: avatar_2
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui; perubahan preferensi jenjang mencatat personalization_saved dari server bila analytics aktif. Nama/avatar saja dan preferensi sama tidak mencatat perubahan personalisasi.
 *       400:
 *         description: Body harus objek JSON; name harus teks, allJenjang harus boolean, dan jenjang_id bila tidak null harus nama SD/SMP/SMA atau ObjectId jenjang yang tersedia. Data profil lain harus sesuai schema.
 *       401:
 *         description: Token tidak valid atau sudah kedaluwarsa
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Server error
 */
router.patch("/", authMiddleware, updateProfile);

module.exports = router;
