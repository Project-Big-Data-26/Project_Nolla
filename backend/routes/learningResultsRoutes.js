const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getLearningResults,
} = require("../controllers/learningResultsController");

const router = express.Router();

/**
 * @swagger
 * /api/learning-results:
 *   get:
 *     summary: Mendapatkan hasil pembelajaran BAB yang sudah pernah dikuizkan
 *     tags: [Learning Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kelas
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter berdasarkan nomor kelas
 *         example: 12
 *     responses:
 *       200:
 *         description: Hasil pembelajaran berhasil diambil beserta ringkasan progres BAB
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, summary, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   type: object
 *                   properties:
 *                     completed_bab:
 *                       type: integer
 *                       example: 1
 *                     in_progress_bab:
 *                       type: integer
 *                       example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, name, progress, total_subbab, started_subbab, completed_subbab, status]
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       class_reference:
 *                         type: string
 *                         example: Kelas 12
 *                       progress:
 *                         type: integer
 *                         description: Rata-rata progres seluruh subbab (0-100), sama dengan dashboard
 *                         example: 75
 *                       total_subbab:
 *                         type: integer
 *                       started_subbab:
 *                         type: integer
 *                         description: Jumlah subbab yang memiliki sesi kuis
 *                       completed_subbab:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [completed, in_progress]
 *       400:
 *         description: Parameter kelas harus berupa angka
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan saat mengambil hasil pembelajaran
 */
router.get("/", authMiddleware, getLearningResults);

module.exports = router;
