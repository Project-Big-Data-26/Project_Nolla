const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getClassesByToken,
} = require("../controllers/master-data/classController");
const { getBab } = require("../controllers/dashboardController");

/**
 * @swagger
 * /api/dashboard/classes:
 *   get:
 *     summary: Mendapatkan daftar kelas user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar kelas berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, status, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   required: [jenjang, classes]
 *                   properties:
 *                     jenjang:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 66a100000000000000000001
 *                         name:
 *                           type: string
 *                           example: SMA/MA
 *                     classes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [name, nomor_kelas]
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Kelas 12
 *                           nomor_kelas:
 *                             type: integer
 *                             example: 12
 *             examples:
 *               success:
 *                 summary: Jenjang user tersedia
 *                 value:
 *                   statusCode: 200
 *                   status: success
 *                   data:
 *                     jenjang:
 *                       id: 66a100000000000000000001
 *                       name: SMA/MA
 *                     classes:
 *                       - name: Kelas 10
 *                         nomor_kelas: 10
 *                       - name: Kelas 11
 *                         nomor_kelas: 11
 *                       - name: Kelas 12
 *                         nomor_kelas: 12
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access token tidak ditemukan
 *       404:
 *         description: User atau jenjang tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Terjadi kesalahan pada server
 */
router.get("/classes", authMiddleware, getClassesByToken);

/**
 * @swagger
 * /api/dashboard/bab:
 *   get:
 *     summary: Mendapatkan daftar bab dan progress subbab
 *     tags: [Dashboard]
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
 *         description: Daftar bab dan progress berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [statusCode, success, message, filter, data]
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Data BAB berhasil diambil.
 *                 filter:
 *                   type: object
 *                   required: [kelas, is_filtered, jenjang, all_jenjang]
 *                   properties:
 *                     kelas:
 *                       type: integer
 *                       nullable: true
 *                       example: 12
 *                     is_filtered:
 *                       type: boolean
 *                       example: true
 *                     jenjang:
 *                       type: string
 *                       nullable: true
 *                       description: ID jenjang user, atau null jika tidak ditetapkan
 *                       example: 66a100000000000000000001
 *                     all_jenjang:
 *                       type: boolean
 *                       description: true jika user tidak terikat pada jenjang tertentu
 *                       example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, name, description, display_order, has_pretest, progress, total_subbab, completed_subbab, subbab]
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 66a200000000000000000001
 *                       name:
 *                         type: string
 *                         example: Peluang
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       display_order:
 *                         type: integer
 *                         example: 4
 *                       has_pretest:
 *                         type: boolean
 *                         description: Apakah user sudah menyelesaikan pretest bab ini
 *                         example: true
 *                       progress:
 *                         type: integer
 *                         description: Persentase subbab selesai, dari 0 sampai 100
 *                         example: 50
 *                       total_subbab:
 *                         type: integer
 *                         example: 2
 *                       completed_subbab:
 *                         type: integer
 *                         example: 1
 *                       subbab:
 *                         type: array
 *                         description: Kosong sebelum pretest bab selesai; berisi daftar subbab setelah pretest selesai
 *                         items:
 *                           type: object
 *                           required: [id, name, description, display_order, completed]
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: 66a300000000000000000001
 *                             name:
 *                               type: string
 *                               example: Peluang Suatu Kejadian
 *                             description:
 *                               type: string
 *                               nullable: true
 *                             display_order:
 *                               type: integer
 *                               example: 1
 *                             completed:
 *                               type: boolean
 *                               example: true
 *             examples:
 *               babDenganProgress:
 *                 summary: Bab sudah dipretest dan memiliki progress subbab
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Data BAB berhasil diambil.
 *                   filter:
 *                     kelas: 12
 *                     is_filtered: true
 *                     jenjang: null
 *                     all_jenjang: true
 *                   data:
 *                     - id: 66a200000000000000000001
 *                       name: Peluang
 *                       description: Materi peluang
 *                       display_order: 4
 *                       has_pretest: true
 *                       progress: 50
 *                       total_subbab: 2
 *                       completed_subbab: 1
 *                       subbab:
 *                         - id: 66a300000000000000000001
 *                           name: Peluang Suatu Kejadian
 *                           description: Peluang kejadian tunggal
 *                           display_order: 1
 *                           completed: true
 *                         - id: 66a300000000000000000002
 *                           name: Peluang Kejadian Majemuk
 *                           description: Peluang kejadian majemuk
 *                           display_order: 2
 *                           completed: false
 *               babBelumPretest:
 *                 summary: Bab belum dipretest, daftar subbab belum ditampilkan
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Data BAB berhasil diambil.
 *                   filter:
 *                     kelas: 12
 *                     is_filtered: true
 *                     jenjang: null
 *                     all_jenjang: true
 *                   data:
 *                     - id: 66a200000000000000000002
 *                       name: Turunan Fungsi
 *                       description: null
 *                       display_order: 2
 *                       has_pretest: false
 *                       progress: 0
 *                       total_subbab: 4
 *                       completed_subbab: 0
 *                       subbab: []
 *       400:
 *         description: Parameter kelas harus berupa angka
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Parameter kelas harus berupa angka.
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access token tidak ditemukan
 *       404:
 *         description: User tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan saat mengambil data bab
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Terjadi kesalahan saat mengambil data BAB.
 *                 error:
 *                   type: string
 *                   example: Database connection failed
 */
router.get("/bab", authMiddleware, getBab);

module.exports = router;
