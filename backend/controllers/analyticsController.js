const { ingestBrowserEvents } = require("../services/analyticsBrowserEvents");

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 60;
// Per proses; cukup untuk satu instance. Multi-instance butuh penyimpanan bersama.
const requestWindows = new Map();

const isRateLimited = (userId, now) => {
  const window = requestWindows.get(userId);
  if (!window || now - window.startedAt >= RATE_WINDOW_MS) {
    if (requestWindows.size > 10000) {
      for (const [key, value] of requestWindows) {
        if (now - value.startedAt >= RATE_WINDOW_MS) requestWindows.delete(key);
      }
    }
    requestWindows.set(userId, { startedAt: now, count: 1 });
    return false;
  }
  window.count += 1;
  return window.count > RATE_MAX_REQUESTS;
};

const collectEvents = async (req, res) => {
  try {
    if (isRateLimited(req.user.id, Date.now())) {
      res.set("Retry-After", String(RATE_WINDOW_MS / 1000));
      return res.status(429).json({
        statusCode: 429,
        success: false,
        message: "Terlalu banyak pengiriman event. Coba lagi nanti.",
      });
    }

    const { error, results } = await ingestBrowserEvents(
      req.user,
      req.body?.events,
    );

    if (error) {
      return res.status(400).json({ statusCode: 400, success: false, message: error });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Event diproses",
      data: { results },
    });
  } catch {
    // Batch tidak tersimpan; client mengirim ulang dengan event_id yang sama.
    return res.status(503).json({
      statusCode: 503,
      success: false,
      message: "Event belum dapat disimpan. Kirim ulang nanti.",
    });
  }
};

module.exports = { collectEvents };
