const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMySubscription,
  getPlans,
  startTrial,
} = require("../controllers/subscriptionController");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Entitlement:
 *       type: object
 *       required: [plan, is_trial, package, active_until, trial, limits]
 *       properties:
 *         plan:
 *           type: string
 *           enum: [free, premium]
 *         is_trial:
 *           type: boolean
 *           description: true bila premium hanya berasal dari trial (freemium)
 *         package:
 *           type: string
 *           nullable: true
 *           enum: [weekly, monthly, yearly, null]
 *           description: Tipe paket dari periode aktif non-trial; null untuk free, trial, atau premium manual per hari
 *         active_until:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         trial:
 *           type: object
 *           properties:
 *             available:
 *               type: boolean
 *             started_at:
 *               type: string
 *               format: date-time
 *               nullable: true
 *             ends_at:
 *               type: string
 *               format: date-time
 *               nullable: true
 *         limits:
 *           type: object
 *           properties:
 *             quiz_sessions_per_subbab:
 *               type: integer
 *               nullable: true
 *               description: 3 untuk free, null (tanpa batas) untuk premium
 *               example: 3
 */

/**
 * @swagger
 * /api/subscription/me:
 *   get:
 *     summary: Status paket user (free/premium, trial, batas kuis)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status paket berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
 *                   $ref: '#/components/schemas/Entitlement'
 *       401:
 *         description: Token tidak valid
 */
router.get("/me", authMiddleware, getMySubscription);

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     summary: Katalog paket Premium (harga dari env server)
 *     description: >
 *       Harga dalam Rupiah bulat. Diskon percentage dibulatkan ke rupiah terdekat.
 *       Paket yang PRICE-nya tidak dikonfigurasi tidak ditampilkan. purchasable false
 *       selama payment gateway belum tersedia.
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katalog paket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     currency:
 *                       type: string
 *                       example: IDR
 *                     purchasable:
 *                       type: boolean
 *                       example: false
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [code, name, duration_days, price, discount, final_price]
 *                         properties:
 *                           code:
 *                             type: string
 *                             enum: [weekly, monthly, yearly]
 *                           name:
 *                             type: string
 *                             example: Premium Bulanan
 *                           duration_days:
 *                             type: integer
 *                             example: 30
 *                           price:
 *                             type: integer
 *                             description: Harga normal
 *                             example: 49000
 *                           discount:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: [flat, percentage]
 *                               value:
 *                                 type: number
 *                                 example: 20
 *                               amount:
 *                                 type: integer
 *                                 description: Potongan dalam Rupiah
 *                                 example: 9800
 *                           final_price:
 *                             type: integer
 *                             example: 39200
 *       401:
 *         description: Token tidak valid
 */
router.get("/plans", authMiddleware, getPlans);

/**
 * @swagger
 * /api/subscription/trial:
 *   post:
 *     summary: Mulai trial premium 3 hari (sekali per akun)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Trial dimulai; data berisi status paket terbaru
 *       200:
 *         description: Trial sudah berjalan (permintaan ulang aman)
 *       409:
 *         description: >
 *           code TRIAL_ALREADY_USED (trial pernah dipakai) atau
 *           ALREADY_PREMIUM (sedang premium dari sumber lain)
 *       401:
 *         description: Token tidak valid
 */
router.post("/trial", authMiddleware, startTrial);

module.exports = router;
