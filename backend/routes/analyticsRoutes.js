const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { collectEvents } = require("../controllers/analyticsController");

const router = express.Router();

/**
 * @swagger
 * /api/analytics/events:
 *   post:
 *     summary: Kirim batch event perilaku dari browser
 *     description: |
 *       Hanya event browser yang ada di allowlist (lihat docs/hasil-perbatch.md, Batch 4).
 *       Identitas (pseudonim), sumber event, waktu diterima, environment, dan cohort ditetapkan server.
 *       Field atau properti di luar skema membuat event ditolak. Attempt harus milik user.
 *       Bila analytics nonaktif (ANALYTICS_ENABLED bukan "true"), semua event berstatus dropped_disabled.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [events]
 *             properties:
 *               events:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required: [event_id, event_name, schema_version, occurred_at, learning_session_id, page_instance_id]
 *                   properties:
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *                       description: Tetap sama saat retry
 *                     event_name:
 *                       type: string
 *                       example: question_viewed
 *                     schema_version:
 *                       type: integer
 *                       enum: [1]
 *                     occurred_at:
 *                       type: string
 *                       format: date-time
 *                     learning_session_id:
 *                       type: string
 *                       pattern: "^[A-Za-z0-9_-]{8,64}$"
 *                     page_instance_id:
 *                       type: string
 *                       pattern: "^[A-Za-z0-9_-]{8,64}$"
 *                     assessment_type:
 *                       type: string
 *                       enum: [pretest, quiz]
 *                     assessment_attempt_id:
 *                       type: string
 *                     route_name:
 *                       type: string
 *                       pattern: "^[a-z][a-z0-9_]{0,47}$"
 *                     quality_flags:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [clock_skew, partial_timing, offline_replay, asset_load_failed, multiple_tabs]
 *                     properties:
 *                       type: object
 *     responses:
 *       200:
 *         description: Status per event (accepted, duplicate, rejected + reason, retry, dropped_disabled)
 *       400:
 *         description: Batch kosong, bukan array, atau melebihi 50 event
 *       401:
 *         description: Access token tidak valid atau tidak tersedia
 *       429:
 *         description: Melebihi 60 request per menit per user
 *       503:
 *         description: Batch tidak tersimpan; kirim ulang dengan event_id yang sama
 */
router.post("/events", authMiddleware, collectEvents);

module.exports = router;
