const Langganan = require("../models/Langganan");
const { TRIAL_DURATION_MS, getEntitlement } = require("../services/entitlement");
const {
  contextFromRequest,
  recordServerEvents,
} = require("../services/analyticsService");

const sendError = (res, statusCode, code, message) =>
  res.status(statusCode).json({ statusCode, success: false, code, message });

const sendEntitlement = (res, statusCode, message, entitlement) =>
  res.status(statusCode).json({
    statusCode,
    success: true,
    message,
    data: entitlement,
  });

const getMySubscription = async (req, res) => {
  try {
    const entitlement = await getEntitlement(req.user.id);
    return sendEntitlement(res, 200, "Status paket berhasil diambil.", entitlement);
  } catch (error) {
    console.error("Get subscription error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Gagal mengambil status paket.");
  }
};

const startTrial = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const entitlement = await getEntitlement(userId, now);

    // Klik ulang saat trial berjalan: idempoten, bukan error.
    if (entitlement.is_trial) {
      return sendEntitlement(res, 200, "Trial premium sedang berjalan.", entitlement);
    }
    if (!entitlement.trial.available) {
      return sendError(res, 409, "TRIAL_ALREADY_USED", "Trial premium sudah pernah digunakan.");
    }
    if (entitlement.plan === "premium") {
      return sendError(
        res,
        409,
        "ALREADY_PREMIUM",
        "Akun sedang premium; trial disimpan untuk nanti.",
      );
    }

    try {
      await Langganan.create({
        user_id: userId,
        source: "trial",
        starts_at: now,
        ends_at: new Date(now.getTime() + TRIAL_DURATION_MS),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      // Request paralel lain sudah membuat trial (indeks unik).
      const current = await getEntitlement(userId);
      if (current.is_trial) {
        return sendEntitlement(res, 200, "Trial premium sedang berjalan.", current);
      }
      return sendError(res, 409, "TRIAL_ALREADY_USED", "Trial premium sudah pernah digunakan.");
    }

    await recordServerEvents(contextFromRequest(req), [
      {
        name: "trial_started",
        businessKey: `trial_started:${userId}`,
        properties: { duration_hours: TRIAL_DURATION_MS / (60 * 60 * 1000) },
      },
    ]);

    return sendEntitlement(
      res,
      201,
      "Trial premium 3 hari dimulai.",
      await getEntitlement(userId),
    );
  } catch (error) {
    console.error("Start trial error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Gagal memulai trial premium.");
  }
};

module.exports = { getMySubscription, startTrial };
