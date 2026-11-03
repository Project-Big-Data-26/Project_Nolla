const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMySubscription,
  startTrial,
} = require("../controllers/subscriptionController");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Entitlement:
 *       type: object
 *       required: [plan, is_trial, active_until, trial, limits]
 *       properties:
 *         plan:
 *           type: string
 *           enum: [free, premium]
 *         is_trial:
 *           type: boolean
 *           description: true bila premium hanya berasal dari trial (freemium)
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
