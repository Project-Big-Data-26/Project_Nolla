// Penyimpanan event analytics. Sengaja tanpa console.*: event hanya disimpan
// ke koleksi analytics_events, tidak pernah dicetak sebagai jalur cadangan.
const crypto = require("crypto");

const AnalyticsEvent = require("../models/AnalyticsEvent");
const AnalyticsIdentity = require("../models/AnalyticsIdentity");
const { isDuplicateKeyError } = require("../utils/transaction");
const { SCHEMA_VERSION } = require("./analyticsEventSchema");
const PURPOSE = "product_analytics";

const parsePositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const getConfig = () => ({
  enabled: process.env.ANALYTICS_ENABLED === "true",
  environment:
    process.env.ANALYTICS_ENVIRONMENT || process.env.NODE_ENV || "development",
  appVersion: process.env.APP_VERSION || null,
  noticeVersion: process.env.ANALYTICS_NOTICE_VERSION || null,
  retentionDays: parsePositiveInt(process.env.ANALYTICS_RETENTION_DAYS),
  internalEmailDomains: (process.env.ANALYTICS_INTERNAL_EMAIL_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
});

const getCohort = (email, config) => {
  const domain = String(email || "").toLowerCase().split("@")[1];
  return domain && config.internalEmailDomains.includes(domain)
    ? "internal"
    : "external";
};

const getAnalyticsUserId = async (userId, dbSession = null) => {
  const lookup = () =>
    AnalyticsIdentity.findOneAndUpdate(
      { user_id: userId },
      {
        $setOnInsert: {
          analytics_user_id: `usr_${crypto.randomBytes(16).toString("hex")}`,
          created_at: new Date(),
        },
      },
      { upsert: true, returnDocument: "after", session: dbSession, lean: true },
    );

  try {
    return (await lookup()).analytics_user_id;
  } catch (error) {
    // Upsert paralel di luar transaksi: pemenang sudah membuat mapping.
    if (dbSession || !isDuplicateKeyError(error)) throw error;
    return (await lookup()).analytics_user_id;
  }
};

// Konteks dari request terautentikasi, atau user eksplisit (mis. callback OAuth).
const contextFromRequest = (req, user = null) => ({
  userId: user?._id ?? req.user?.id ?? null,
  email: user?.email ?? req.user?.email ?? null,
  requestId: req.requestId ?? null,
  learningSessionId: req.learningSessionId ?? null,
  pageInstanceId: req.pageInstanceId ?? null,
});

const buildEnvelope = ({ config, analyticsUserId, cohort, now }) => ({
  schema_version: SCHEMA_VERSION,
  received_at: now,
  environment: config.environment,
  app_version: config.appVersion,
  cohort,
  analytics_user_id: analyticsUserId,
  processing_context: { purpose: PURPOSE, notice_version: config.noticeVersion },
  expires_at: config.retentionDays
    ? new Date(now.getTime() + config.retentionDays * 24 * 60 * 60 * 1000)
    : null,
});

const toId = (value) => (value == null ? null : String(value));

/**
 * events: [{ name, businessKey?, assessmentType?, attemptId?, itemId?, routeName?, properties }]
 * Dengan dbSession: bagian dari transaksi hasil (gagal = transaksi gagal).
 * Tanpa dbSession: best-effort; kegagalan tidak menggagalkan operasi pengguna.
 */
const recordServerEvents = async (context, events, dbSession = null) => {
  const config = getConfig();
  if (!config.enabled || !context?.userId || events.length === 0) return;

  const write = async () => {
    const now = new Date();
    const envelope = buildEnvelope({
      config,
      analyticsUserId: await getAnalyticsUserId(context.userId, dbSession),
      cohort: getCohort(context.email, config),
      now,
    });

    const operations = events.map((event) => {
      const document = {
        ...envelope,
        event_id: crypto.randomUUID(),
        event_name: event.name,
        event_source: "server",
        occurred_at: now,
        committed_at: now,
        learning_session_id: context.learningSessionId,
        page_instance_id: context.pageInstanceId,
        request_id: context.requestId,
        assessment_type: event.assessmentType ?? null,
        assessment_attempt_id: toId(event.attemptId),
        assessment_item_id: event.itemId ?? null,
        route_name: event.routeName ?? null,
        business_key: event.businessKey ?? null,
        quality_flags: [],
        properties: event.properties ?? {},
      };

      return event.businessKey
        ? {
            updateOne: {
              filter: { business_key: event.businessKey },
              update: { $setOnInsert: document },
              upsert: true,
            },
          }
        : { insertOne: { document } };
    });

    await AnalyticsEvent.collection.bulkWrite(operations, {
      ordered: true,
      session: dbSession ?? undefined,
    });
  };

  if (dbSession) return write();

  try {
    await write();
  } catch {
    // Best-effort di luar transaksi; event domain dapat direkonstruksi dari
    // data operasional memakai business_key yang sama.
  }
};

const recordApplicationError = (req, { operation, statusCode, reasonCode }) =>
  recordServerEvents(contextFromRequest(req), [
    {
      name: "application_error",
      properties: {
        operation,
        reason_code: reasonCode ?? "internal_error",
        http_status: statusCode,
        retriable: statusCode >= 500,
      },
    },
  ]);

module.exports = {
  buildEnvelope,
  contextFromRequest,
  getAnalyticsUserId,
  getCohort,
  getConfig,
  recordApplicationError,
  recordServerEvents,
  toId,
};
