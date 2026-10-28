const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  startQuiz,
  submitQuiz,
  getQuizResult,
  getQuizReview,
} = require("../controllers/quizController");

const router = express.Router();

/**
 * @swagger
 * /api/quiz/start:
 *   post:
 *     summary: Memulai quiz atau melanjutkan sesi yang belum selesai
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subbab_id]
 *             properties:
 *               subbab_id:
 *                 type: string
 *                 description: ID subbab
 *     responses:
 *       200:
 *         description: Sesi quiz aktif dilanjutkan beserta soal-soal sesi yang sama
 *       201:
 *         description: Sesi quiz baru berhasil dibuat
 *       400:
 *         description: subbab_id tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: Subbab belum tersedia karena pretest bab belum selesai
 *       409:
 *         description: Bank soal belum mencukupi, soal track habis, atau ada soal sesi yang sudah tidak tersedia
 *       500:
 *         description: Gagal memulai quiz
 */
router.post("/start", authMiddleware, startQuiz);

/**
 * @swagger
 * /api/quiz/{sessionId}/submit:
 *   post:
 *     summary: Mengirim jawaban dan menyelesaikan sesi quiz
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi quiz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [question_id]
 *                   properties:
 *                     question_id:
 *                       type: string
 *                     selected_option:
 *                       type: string
 *                     selected_answer:
 *                       type: string
 *                     response_time:
 *                       type: number
 *                       nullable: true
 *                       description: (Lama) waktu menjawab dalam detik
 *                     response_time_ms:
 *                       type: integer
 *                       nullable: true
 *                       minimum: 0
 *                       description: Waktu tampil/menjawab soal dalam milidetik; null bila tidak diketahui (jangan diisi 0)
 *                     response_time_partial:
 *                       type: boolean
 *                       nullable: true
 *                       description: true bila sebagian waktu tidak terukur (refresh, tab tersembunyi)
 *               duration:
 *                 type: number
 *                 nullable: true
 *                 minimum: 0
 *                 description: Durasi quiz dalam detik
 *               timing_method:
 *                 type: string
 *                 nullable: true
 *                 enum: [client_visible_v1]
 *                 description: Versi metode pengukuran waktu di frontend
 *     responses:
 *       200:
 *         description: "Quiz berhasil disubmit dan rating cognitive diperbarui. Submit ulang (retry/paralel) pada sesi yang sudah selesai juga 200 dengan already_submitted=true dan hasil tersimpan, tanpa memperbarui rating lagi."
 *       400:
 *         description: Format answers atau question_id tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       404:
 *         description: Sesi quiz tidak ditemukan
 *       409:
 *         description: Soal sesi tidak lagi tersedia atau rating subbab tidak ditemukan (tidak ada data yang ditulis)
 *       500:
 *         description: Gagal mengirim hasil quiz
 */
router.post("/:sessionId/submit", authMiddleware, submitQuiz);

/**
 * @swagger
 * /api/quiz/{sessionId}/result:
 *   get:
 *     summary: Mendapatkan hasil sesi quiz
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi quiz
 *     responses:
 *       200:
 *         description: Hasil quiz berhasil diambil
 *       400:
 *         description: sessionId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       404:
 *         description: Sesi quiz tidak ditemukan
 *       500:
 *         description: Gagal mengambil hasil quiz
 */
router.get("/:sessionId/result", authMiddleware, getQuizResult);

/**
 * @swagger
 * /api/quiz/{sessionId}/review:
 *   get:
 *     summary: Mendapatkan detail jawaban quiz yang sudah selesai
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi quiz
 *     responses:
 *       200:
 *         description: Detail soal, jawaban pengguna, dan kunci jawaban
 *       400:
 *         description: sessionId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       404:
 *         description: Sesi quiz tidak ditemukan
 *       409:
 *         description: Quiz belum diselesaikan
 *       500:
 *         description: Gagal mengambil review quiz
 */
router.get("/:sessionId/review", authMiddleware, getQuizReview);

module.exports = router;
