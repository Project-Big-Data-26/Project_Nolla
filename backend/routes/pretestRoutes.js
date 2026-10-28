const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPretestStatus,
  startPretest,
  getNextQuestion,
  answerPretestQuestion,
  submitPretest,
  getPretestResult,
  getPretestReview,
  discardPretest,
} = require("../controllers/pretestController");

const router = express.Router();

/**
 * @swagger
 * /api/pretest/status/{babId}:
 *   get:
 *     summary: Mendapatkan status pretest sebuah bab
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: babId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bab
 *     responses:
 *       200:
 *         description: Status pretest berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Status pretest berhasil diambil.
 *                 data:
 *                   type: object
 *                   required: [bab_id, has_pretest, status]
 *                   properties:
 *                     bab_id:
 *                       type: string
 *                       example: 66a200000000000000000001
 *                     has_pretest:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       enum: [not_started, active, completed]
 *                       example: active
 *                     pretest_id:
 *                       type: string
 *                       description: Tidak dikirim jika pretest belum pernah dibuat
 *                       example: 66a400000000000000000001
 *             examples:
 *               belumDimulai:
 *                 summary: Pretest belum pernah dibuat
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Pretest belum pernah dibuat untuk bab ini.
 *                   data:
 *                     bab_id: 66a200000000000000000001
 *                     has_pretest: false
 *                     status: not_started
 *               sedangBerjalan:
 *                 summary: Pretest masih aktif
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Status pretest berhasil diambil.
 *                   data:
 *                     bab_id: 66a200000000000000000001
 *                     has_pretest: true
 *                     status: active
 *                     pretest_id: 66a400000000000000000001
 *       400:
 *         description: babId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       404:
 *         description: Bab tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan saat mengambil status
 */
router.get("/status/:babId", authMiddleware, getPretestStatus);

/**
 * @swagger
 * /api/pretest/start:
 *   post:
 *     summary: Memulai pretest untuk sebuah bab
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bab_id]
 *             properties:
 *               bab_id:
 *                 type: string
 *                 description: ID bab
 *     responses:
 *       201:
 *         description: Pretest berhasil dimulai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pretest berhasil dimulai.
 *                 data:
 *                   type: object
 *                   required: [pretest_id, bab_id, started_at, status, total_questions, stage, first_question]
 *                   properties:
 *                     pretest_id:
 *                       type: string
 *                       example: 66a400000000000000000001
 *                     bab_id:
 *                       type: string
 *                       example: 66a200000000000000000001
 *                     started_at:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [active]
 *                     total_questions:
 *                       type: integer
 *                       example: 5
 *                     stage:
 *                       type: string
 *                       enum: [prerequisite, subbab]
 *                     first_question:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         question_id:
 *                           type: string
 *                         subbab_id:
 *                           type: string
 *                         question_text:
 *                           type: string
 *                         soal_type:
 *                           type: string
 *                           nullable: true
 *                         options:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               option_id:
 *                                 type: string
 *                               text:
 *                                 type: string
 *                         option_texts:
 *                           type: array
 *                           items:
 *                             type: string
 *                         image_url:
 *                           type: array
 *                           items:
 *                             type: string
 *                         cognitive_score:
 *                           type: number
 *                           nullable: true
 *                         stage:
 *                           type: string
 *                           enum: [prerequisite, subbab]
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Pretest berhasil dimulai.
 *               data:
 *                 pretest_id: 66a400000000000000000001
 *                 bab_id: 66a200000000000000000001
 *                 started_at: "2026-09-27T10:00:00.000Z"
 *                 status: active
 *                 total_questions: 5
 *                 stage: prerequisite
 *                 first_question:
 *                   question_id: 66a500000000000000000001
 *                   subbab_id: 66a300000000000000000001
 *                   question_text: Berapakah peluang munculnya angka genap?
 *                   soal_type: multiple_choice
 *                   options:
 *                     - option_id: A
 *                       text: 1/3
 *                     - option_id: B
 *                       text: 1/2
 *                   option_texts: ["1/3", "1/2"]
 *                   image_url: []
 *                   cognitive_score: 1400
 *                   stage: prerequisite
 *       400:
 *         description: bab_id tidak valid atau bab belum memiliki soal
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       404:
 *         description: Bab tidak ditemukan
 *       409:
 *         description: Pretest untuk bab ini sudah ada atau masih berlangsung
 *       500:
 *         description: Terjadi kesalahan saat memulai pretest
 */
router.post("/start", authMiddleware, startPretest);

/**
 * @swagger
 * /api/pretest/{pretestId}/question:
 *   get:
 *     summary: Mendapatkan soal aktif berikutnya pada pretest
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pretestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi pretest
 *     responses:
 *       200:
 *         description: Soal berikutnya atau status semua soal telah dijawab
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     pretest_id:
 *                       type: string
 *                     bab_id:
 *                       type: string
 *                     question:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         question_id:
 *                           type: string
 *                         subbab_id:
 *                           type: string
 *                         question_text:
 *                           type: string
 *                         soal_type:
 *                           type: string
 *                           nullable: true
 *                         options:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               option_id:
 *                                 type: string
 *                               text:
 *                                 type: string
 *                         option_texts:
 *                           type: array
 *                           items:
 *                             type: string
 *                         image_url:
 *                           type: array
 *                           items:
 *                             type: string
 *                         cognitive_score:
 *                           type: number
 *                           nullable: true
 *                         stage:
 *                           type: string
 *                           enum: [prerequisite, subbab]
 *                     sequence:
 *                       type: integer
 *                       example: 2
 *                     total_questions:
 *                       type: integer
 *                       example: 5
 *                     stage:
 *                       type: string
 *                       enum: [prerequisite, subbab]
 *             examples:
 *               questionTersedia:
 *                 summary: Soal berikutnya tersedia
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Soal pretest berhasil diambil.
 *                   data:
 *                     pretest_id: 66a400000000000000000001
 *                     bab_id: 66a200000000000000000001
 *                     question:
 *                       question_id: 66a500000000000000000002
 *                       subbab_id: 66a300000000000000000001
 *                       question_text: Berapakah peluang munculnya angka genap?
 *                       soal_type: multiple_choice
 *                       options:
 *                         - option_id: A
 *                           text: 1/3
 *                         - option_id: B
 *                           text: 1/2
 *                       option_texts: ["1/3", "1/2"]
 *                       image_url: []
 *                       cognitive_score: 1400
 *                       stage: prerequisite
 *                     sequence: 2
 *                     total_questions: 5
 *                     stage: prerequisite
 *               questionHabis:
 *                 summary: Semua soal sudah dijawab
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Semua soal sudah dijawab.
 *                   data:
 *                     pretest_id: 66a400000000000000000001
 *                     bab_id: 66a200000000000000000001
 *                     total_questions: 5
 *                     sequence: 5
 *                     next_question: null
 *       400:
 *         description: pretestId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: User tidak memiliki akses ke pretest
 *       404:
 *         description: Pretest tidak ditemukan
 *       409:
 *         description: Pretest sudah selesai
 *       500:
 *         description: Terjadi kesalahan saat mengambil soal
 */
router.get("/:pretestId/question", authMiddleware, getNextQuestion);

/**
 * @swagger
 * /api/pretest/{pretestId}/answer:
 *   post:
 *     summary: Menyimpan jawaban soal pretest
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pretestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi pretest
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question_id, selected_answer]
 *             properties:
 *               question_id:
 *                 type: string
 *               selected_answer:
 *                 type: string
 *               response_time:
 *                 type: number
 *                 nullable: true
 *                 description: (Lama) waktu menjawab dalam detik
 *               response_time_ms:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 0
 *                 description: Waktu menjawab dalam milidetik; null bila tidak diketahui (jangan diisi 0)
 *               response_time_partial:
 *                 type: boolean
 *                 nullable: true
 *                 description: true bila sebagian waktu tidak terukur (refresh, tab tersembunyi)
 *     responses:
 *       200:
 *         description: Jawaban berhasil disimpan dan soal berikutnya dikembalikan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Jawaban berhasil disimpan.
 *                 data:
 *                   type: object
 *                   required: [pretest_id, bab_id, stage, is_correct, answer_record_id, sequence, total_questions, progress, next_question, next_question_sequence, next_stage, is_last_question]
 *                   properties:
 *                     pretest_id:
 *                       type: string
 *                     bab_id:
 *                       type: string
 *                     stage:
 *                       type: string
 *                       enum: [prerequisite, subbab]
 *                     is_correct:
 *                       type: boolean
 *                     answer_record_id:
 *                       type: string
 *                     sequence:
 *                       type: integer
 *                     total_questions:
 *                       type: integer
 *                     progress:
 *                       type: integer
 *                       description: Persentase soal yang sudah dijawab
 *                       example: 40
 *                     next_question:
 *                       type: object
 *                       nullable: true
 *                       description: Soal berikutnya; null jika semua soal sudah dijawab
 *                       properties:
 *                         question_id:
 *                           type: string
 *                         subbab_id:
 *                           type: string
 *                         question_text:
 *                           type: string
 *                         soal_type:
 *                           type: string
 *                           nullable: true
 *                         options:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               option_id:
 *                                 type: string
 *                               text:
 *                                 type: string
 *                         option_texts:
 *                           type: array
 *                           items:
 *                             type: string
 *                         image_url:
 *                           type: array
 *                           items:
 *                             type: string
 *                         cognitive_score:
 *                           type: number
 *                           nullable: true
 *                         stage:
 *                           type: string
 *                           enum: [prerequisite, subbab]
 *                     next_question_sequence:
 *                       type: integer
 *                     next_stage:
 *                       type: string
 *                       enum: [prerequisite, subbab]
 *                     is_last_question:
 *                       type: boolean
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Jawaban berhasil disimpan.
 *               data:
 *                 pretest_id: 66a400000000000000000001
 *                 bab_id: 66a200000000000000000001
 *                 stage: prerequisite
 *                 is_correct: true
 *                 answer_record_id: 66a600000000000000000001
 *                 sequence: 1
 *                 total_questions: 5
 *                 progress: 20
 *                 next_question:
 *                   question_id: 66a500000000000000000002
 *                   subbab_id: 66a300000000000000000001
 *                   question_text: Berapakah peluang munculnya angka ganjil?
 *                   soal_type: multiple_choice
 *                   options: []
 *                   option_texts: []
 *                   image_url: []
 *                   cognitive_score: 1400
 *                   stage: prerequisite
 *                 next_question_sequence: 2
 *                 next_stage: prerequisite
 *                 is_last_question: false
 *       400:
 *         description: Input tidak valid atau soal bukan bagian dari pretest
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: User tidak memiliki akses ke pretest
 *       404:
 *         description: Pretest atau soal tidak ditemukan
 *       409:
 *         description: Pretest selesai/dibatalkan, soal sudah dijawab, bukan soal aktif, atau jawaban lain diproses bersamaan
 *       500:
 *         description: Terjadi kesalahan saat menyimpan jawaban
 */
router.post("/:pretestId/answer", authMiddleware, answerPretestQuestion);

/**
 * @swagger
 * /api/pretest/{pretestId}/submit:
 *   post:
 *     summary: Menyelesaikan pretest dan menghitung hasil
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pretestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi pretest
 *     responses:
 *       200:
 *         description: Pretest berhasil diselesaikan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pretest berhasil diselesaikan.
 *                 data:
 *                   type: object
 *                   required: [pretest_id, bab_id, score, total_questions, correct_answers, status, current_bab_summary, prerequisite_bab_summary, prerequisite_proficiency, difficulty]
 *                   properties:
 *                     pretest_id:
 *                       type: string
 *                     bab_id:
 *                       type: string
 *                     score:
 *                       type: number
 *                       description: Persentase jawaban benar
 *                       example: 80
 *                     total_questions:
 *                       type: integer
 *                       example: 5
 *                     correct_answers:
 *                       type: integer
 *                       example: 4
 *                     status:
 *                       type: string
 *                       enum: [completed]
 *                     current_bab_summary:
 *                       type: object
 *                       properties:
 *                         bab_id:
 *                           type: string
 *                         total_questions:
 *                           type: integer
 *                         correct_answers:
 *                           type: integer
 *                         proficiency:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [unlocked, warning, soft_locked]
 *                     prerequisite_bab_summary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bab_id:
 *                             type: string
 *                           total_questions:
 *                             type: integer
 *                           correct_answers:
 *                             type: integer
 *                           proficiency:
 *                             type: integer
 *                           status:
 *                             type: string
 *                             enum: [unlocked, warning, soft_locked]
 *                     prerequisite_proficiency:
 *                       type: integer
 *                       nullable: true
 *                     difficulty:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subbab_id:
 *                             type: string
 *                           current_cognitive_level:
 *                             type: string
 *                             enum: [easy, medium, hard]
 *                           current_cognitive_score:
 *                             type: number
 *                           pretest_subbab_correct:
 *                             type: integer
 *                           pretest_subbab_total:
 *                             type: integer
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Pretest berhasil diselesaikan.
 *               data:
 *                 pretest_id: 66a400000000000000000001
 *                 bab_id: 66a200000000000000000001
 *                 score: 80
 *                 total_questions: 5
 *                 correct_answers: 4
 *                 status: completed
 *                 current_bab_summary:
 *                   bab_id: 66a200000000000000000001
 *                   total_questions: 4
 *                   correct_answers: 3
 *                   proficiency: 75
 *                   status: unlocked
 *                 prerequisite_bab_summary: []
 *                 prerequisite_proficiency: null
 *                 difficulty:
 *                   - subbab_id: 66a300000000000000000001
 *                     current_cognitive_level: medium
 *                     current_cognitive_score: 1000
 *                     pretest_subbab_correct: 1
 *                     pretest_subbab_total: 2
 *                     updated_at: "2026-09-27T10:05:00.000Z"
 *       400:
 *         description: Jawaban pretest belum lengkap
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: User tidak memiliki akses ke pretest
 *       404:
 *         description: Pretest tidak ditemukan
 *       409:
 *         description: Pretest sudah diselesaikan (termasuk oleh submit paralel lain)
 *       500:
 *         description: Terjadi kesalahan saat finalisasi pretest
 */
router.post("/:pretestId/submit", authMiddleware, submitPretest);

/**
 * @swagger
 * /api/pretest/{pretestId}/result:
 *   get:
 *     summary: Mendapatkan hasil pretest
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pretestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi pretest
 *     responses:
 *       200:
 *         description: Hasil pretest berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Hasil pretest berhasil diambil.
 *                 data:
 *                   type: object
 *                   required: [pretest_id, bab_id, score, total_questions, correct_answers, wrong_answers, duration, prerequisite_bab_result, submateri_result, recommendations, recommendation]
 *                   properties:
 *                     pretest_id:
 *                       type: string
 *                     bab_id:
 *                       type: string
 *                     score:
 *                       type: number
 *                       example: 60
 *                     total_questions:
 *                       type: integer
 *                       example: 5
 *                     correct_answers:
 *                       type: integer
 *                       example: 3
 *                     wrong_answers:
 *                       type: integer
 *                       example: 2
 *                     duration:
 *                       type: integer
 *                       nullable: true
 *                       description: Durasi pengerjaan dalam detik
 *                       example: 120
 *                     prerequisite_bab_result:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [name, status]
 *                         properties:
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [terpenuhi, tidak terpenuhi]
 *                     submateri_result:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [subbab_id, subbab_name, current_cognitive_level, current_cognitive_score]
 *                         properties:
 *                           subbab_id:
 *                             type: string
 *                           subbab_name:
 *                             type: string
 *                           current_cognitive_level:
 *                             type: string
 *                             enum: [easy, medium, hard]
 *                           current_cognitive_score:
 *                             type: string
 *                             example: 1000/1400
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [type, priority, message]
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [prerequisite, subbab, positive]
 *                           priority:
 *                             type: string
 *                             enum: [high, medium, low]
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           message:
 *                             type: string
 *                     recommendation:
 *                       type: string
 *                       description: Semua pesan rekomendasi digabungkan dengan baris baru
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Hasil pretest berhasil diambil.
 *               data:
 *                 pretest_id: 66a400000000000000000001
 *                 bab_id: 66a200000000000000000001
 *                 score: 60
 *                 total_questions: 5
 *                 correct_answers: 3
 *                 wrong_answers: 2
 *                 duration: 120
 *                 prerequisite_bab_result:
 *                   - name: Bab sebelumnya
 *                     status: tidak terpenuhi
 *                 submateri_result:
 *                   - subbab_id: 66a300000000000000000001
 *                     subbab_name: Peluang Suatu Kejadian
 *                     current_cognitive_level: medium
 *                     current_cognitive_score: 1000/1400
 *                 recommendations:
 *                   - type: prerequisite
 *                     priority: high
 *                     name: Bab sebelumnya
 *                     status: tidak terpenuhi
 *                     message: Pelajari kembali materi prasyarat.
 *                   - type: subbab
 *                     priority: medium
 *                     name: Peluang Suatu Kejadian
 *                     status: medium
 *                     message: Perkuat pemahaman subbab dengan latihan tambahan.
 *                 recommendation: |-
 *                   Pelajari kembali materi prasyarat.
 *                   Perkuat pemahaman subbab dengan latihan tambahan.
 *       400:
 *         description: pretestId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: User tidak memiliki akses ke hasil pretest
 *       404:
 *         description: Pretest tidak ditemukan
 *       409:
 *         description: Pretest belum diselesaikan
 *       500:
 *         description: Terjadi kesalahan saat mengambil hasil
 */
router.get("/:pretestId/result", authMiddleware, getPretestResult);

/**
 * @swagger
 * /api/pretest/{pretestId}/review:
 *   get:
 *     summary: Mendapatkan detail jawaban setelah pretest selesai
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pretestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi pretest
 *     responses:
 *       200:
 *         description: Detail soal, jawaban pengguna, dan kunci jawaban
 *       400:
 *         description: pretestId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: User tidak memiliki akses ke review pretest
 *       404:
 *         description: Pretest tidak ditemukan
 *       409:
 *         description: Pretest belum diselesaikan
 *       500:
 *         description: Terjadi kesalahan saat mengambil review
 */
router.get("/:pretestId/review", authMiddleware, getPretestReview);

/**
 * @swagger
 * /api/pretest/{pretestId}/discard:
 *   delete:
 *     summary: Membatalkan pretest yang belum selesai
 *     tags: [Pretest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pretestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sesi pretest
 *     responses:
 *       200:
 *         description: Sesi pretest berhasil dibatalkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sesi pretest berhasil dibatalkan.
 *                 data:
 *                   type: object
 *                   required: [pretest_id, discarded]
 *                   properties:
 *                     pretest_id:
 *                       type: string
 *                       example: 66a400000000000000000001
 *                     discarded:
 *                       type: boolean
 *                       example: true
 *                     already_cancelled:
 *                       type: boolean
 *                       description: true bila pretest sudah dibatalkan sebelumnya (retry aman)
 *                       example: false
 *       400:
 *         description: pretestId tidak valid
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       403:
 *         description: User tidak memiliki akses untuk membatalkan pretest
 *       404:
 *         description: Pretest tidak ditemukan
 *       409:
 *         description: Pretest sudah selesai atau berubah status sehingga tidak dapat dibatalkan
 *       500:
 *         description: Terjadi kesalahan saat membatalkan pretest
 */
router.delete("/:pretestId/discard", authMiddleware, discardPretest);

module.exports = router;
