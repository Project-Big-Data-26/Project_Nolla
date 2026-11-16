const User = require("../models/User");
const {
  getAttributionReport,
  recordFirstTouch,
} = require("../services/attributionService");

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 30;
const requestWindows = new Map();
const REPORT_ROLES = new Set(["Developer", "Project Manager"]);

const isRateLimited = (visitId, now) => {
  const window = requestWindows.get(visitId);
  if (!window || now - window.startedAt >= RATE_WINDOW_MS) {
    if (requestWindows.size > 10000) {
      for (const [key, value] of requestWindows) {
        if (now - value.startedAt >= RATE_WINDOW_MS) requestWindows.delete(key);
      }
      if (requestWindows.size > 10000) {
        requestWindows.delete(requestWindows.keys().next().value);
      }
    }
    requestWindows.set(visitId, { startedAt: now, count: 1 });
    return false;
  }
  window.count += 1;
  return window.count > RATE_MAX_REQUESTS;
};

const collectVisit = async (req, res) => {
  try {
    const visitId = req.body?.visit_id;
    if (
      typeof visitId === "string" &&
      /^vst_[0-9a-f]{48}$/.test(visitId) &&
      isRateLimited(visitId, Date.now())
    ) {
      res.set("Retry-After", String(RATE_WINDOW_MS / 1000));
      return res.status(429).json({
        statusCode: 429,
        success: false,
        message: "Terlalu banyak permintaan pencatatan kunjungan.",
      });
    }

    const result = await recordFirstTouch(req.body);
    if (result.error) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Data atribusi tidak valid.",
        code: result.error,
      });
    }
    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        status: result.status,
        expires_at: result.expires_at ?? null,
      },
    });
  } catch (error) {
    console.error("Attribution visit could not be recorded:", error.message);
    return res.status(503).json({
      statusCode: 503,
      success: false,
      message: "Kunjungan belum dapat dicatat.",
    });
  }
};

const authorizeReport = async (req, res, next) => {
  const configuredRoles = (process.env.ATTRIBUTION_REPORT_ROLES || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  if (
    configuredRoles.length === 0 ||
    configuredRoles.some((role) => !REPORT_ROLES.has(role))
  ) {
    return res.status(403).json({
      statusCode: 403,
      success: false,
      message:
        "Role laporan atribusi belum dikonfigurasi untuk Developer atau Project Manager.",
    });
  }

  try {
    const user = await User.findById(req.user.id).select("role").lean();
    if (!user || !configuredRoles.includes(user.role)) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Akses laporan atribusi ditolak.",
      });
    }
    return next();
  } catch (error) {
    console.error("Attribution report authorization failed:", error.message);
    return res.status(503).json({
      statusCode: 503,
      success: false,
      message: "Otorisasi laporan belum dapat diperiksa.",
    });
  }
};

const getReport = async (req, res) => {
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : null;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;
  if (
    !from ||
    !to ||
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    from >= to ||
    to.getTime() - from.getTime() > 366 * 86400000
  ) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Parameter from dan to harus berupa rentang waktu yang valid.",
    });
  }

  try {
    const rows = await getAttributionReport(from, to);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: { from, to, rows },
    });
  } catch (error) {
    console.error("Attribution report could not be generated:", error.message);
    return res.status(503).json({
      statusCode: 503,
      success: false,
      message: "Laporan atribusi belum dapat dibuat.",
    });
  }
};

module.exports = { authorizeReport, collectVisit, getReport };
