const VisitAttribution = require("../models/VisitAttribution");
const {
  getAnalyticsUserId,
  getConfig: getAnalyticsConfig,
} = require("./analyticsService");
const { isDuplicateKeyError } = require("../utils/transaction");
const { parseAttribution, readPlacements } = require("./attributionSchema");

const CONVERSION_FIELDS = {
  registration: "registration_at",
  quiz_started: "quiz_started_at",
  quiz_completed: "quiz_completed_at",
};

const getRetentionDays = () => {
  const raw = process.env.ANALYTICS_RETENTION_DAYS;
  if (raw === undefined || raw.trim() === "") return 365;
  const days = Number(raw);
  if (!Number.isSafeInteger(days) || days < 365) {
    throw new Error("ANALYTICS_RETENTION_DAYS harus minimal 365 hari");
  }
  return days;
};

const isAnalyticsEnabled = () => getAnalyticsConfig().enabled;

const recordFirstTouch = async (raw, now = new Date()) => {
  if (!isAnalyticsEnabled()) return { status: "dropped_disabled" };

  const parsed = parseAttribution(raw, readPlacements());
  if (parsed.error) return parsed;

  const { attribution } = parsed;
  const document = {
    ...attribution,
    first_seen_at: now,
    conversions: {
      registration_at: null,
      quiz_started_at: null,
      quiz_completed_at: null,
    },
    expires_at: new Date(now.getTime() + getRetentionDays() * 86400000),
  };

  const upsert = () =>
    VisitAttribution.findOneAndUpdate(
      { visit_id: attribution.visit_id },
      { $setOnInsert: document },
      { upsert: true, returnDocument: "after", lean: true },
    );

  try {
    const saved = await upsert();
    return {
      status: "accepted",
      expires_at: saved?.expires_at ?? document.expires_at,
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const existing = await VisitAttribution.findOne({
      visit_id: attribution.visit_id,
    })
      .select("expires_at")
      .lean();
    if (!existing) throw error;
    return { status: "duplicate", expires_at: existing.expires_at };
  }
};

const recordConversion = async (visitId, conversion, now = new Date()) => {
  if (!isAnalyticsEnabled() || !visitId) return false;
  const field = CONVERSION_FIELDS[conversion];
  if (!field) throw new Error("Jenis konversi atribusi tidak valid");

  const result = await VisitAttribution.updateOne(
    { visit_id: visitId, [`conversions.${field}`]: null },
    { $set: { [`conversions.${field}`]: now } },
  );
  return result.modifiedCount === 1;
};

const linkVisitToUser = async (visitId, userId) => {
  if (!isAnalyticsEnabled() || !visitId || !userId) return false;
  const visit = await VisitAttribution.exists({ visit_id: visitId });
  if (!visit) return false;

  const analyticsUserId = await getAnalyticsUserId(userId);
  await VisitAttribution.updateOne(
    { visit_id: visitId, analytics_user_id: null },
    { $set: { analytics_user_id: analyticsUserId } },
  );
  return true;
};

const recordRegistrationAttribution = async (visitId, userId) => {
  const linked = await linkVisitToUser(visitId, userId);
  if (!linked) return false;
  await recordConversion(visitId, "registration");
  return true;
};

const buildReportPipeline = (from, to) => [
  { $match: { first_seen_at: { $gte: from, $lt: to } } },
  {
    $group: {
      _id: {
        source: "$source",
        medium: "$medium",
        campaign: "$campaign",
        content: "$content",
        placement_id: "$placement_id",
      },
      visits: { $sum: 1 },
      registrations: {
        $sum: { $cond: [{ $ne: ["$conversions.registration_at", null] }, 1, 0] },
      },
      quizzes_started: {
        $sum: { $cond: [{ $ne: ["$conversions.quiz_started_at", null] }, 1, 0] },
      },
      quizzes_completed: {
        $sum: { $cond: [{ $ne: ["$conversions.quiz_completed_at", null] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      source: "$_id.source",
      medium: "$_id.medium",
      campaign: "$_id.campaign",
      content: "$_id.content",
      placement_id: "$_id.placement_id",
      visits: 1,
      registrations: 1,
      quizzes_started: 1,
      quizzes_completed: 1,
    },
  },
  {
    $sort: {
      source: 1,
      medium: 1,
      placement_id: 1,
    },
  },
];

const getAttributionReport = async (from, to) => {
  const [rows, placements] = await Promise.all([
    VisitAttribution.aggregate(buildReportPipeline(from, to)),
    Promise.resolve(readPlacements()),
  ]);
  return rows.map((row) => ({
    ...row,
    placement_name: row.placement_id ? placements[row.placement_id] ?? null : null,
  }));
};

module.exports = {
  buildReportPipeline,
  getAttributionReport,
  getRetentionDays,
  linkVisitToUser,
  recordConversion,
  recordFirstTouch,
  recordRegistrationAttribution,
};
