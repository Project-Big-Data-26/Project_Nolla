const assert = require("node:assert/strict");
const { after, beforeEach, mock, test } = require("node:test");
const AnalyticsIdentity = require("../models/AnalyticsIdentity");
const VisitAttribution = require("../models/VisitAttribution");
const { parseAttribution } = require("../services/attributionSchema");
const {
  buildReportPipeline,
  getAttributionReport,
  recordConversion,
  recordFirstTouch,
  recordRegistrationAttribution,
} = require("../services/attributionService");

const visitId = `vst_${"a".repeat(48)}`;
const now = new Date("2026-11-15T00:00:00.000Z");
const previous = {
  analyticsEnabled: process.env.ANALYTICS_ENABLED,
  retentionDays: process.env.ANALYTICS_RETENTION_DAYS,
  placements: process.env.ATTRIBUTION_PLACEMENTS_JSON,
};
let stored;
let writes;
let aggregatePipeline;
let reportRows;

mock.method(VisitAttribution, "findOneAndUpdate", async (filter, update) => {
  writes.push({ filter, update });
  if (!stored) stored = update.$setOnInsert;
  return stored;
});
mock.method(VisitAttribution, "exists", async ({ visit_id }) =>
  stored?.visit_id === visit_id ? { _id: "visit" } : null,
);
mock.method(VisitAttribution, "updateOne", async (filter, update) => {
  writes.push({ filter, update });
  if (!stored || stored.visit_id !== filter.visit_id) return { modifiedCount: 0 };
  const [path] = Object.keys(update.$set);
  if (path === "analytics_user_id") {
    if (stored.analytics_user_id) return { modifiedCount: 0 };
    stored.analytics_user_id = update.$set[path];
    return { modifiedCount: 1 };
  }
  const conversion = path.split(".")[1];
  if (stored.conversions[conversion]) return { modifiedCount: 0 };
  stored.conversions[conversion] = update.$set[path];
  return { modifiedCount: 1 };
});
mock.method(VisitAttribution, "aggregate", async (pipeline) => {
  aggregatePipeline = pipeline;
  return reportRows;
});
mock.method(AnalyticsIdentity, "findOneAndUpdate", async () => ({
  analytics_user_id: "usr_pseudonymous_test",
}));

beforeEach(() => {
  process.env.ANALYTICS_ENABLED = "true";
  delete process.env.ANALYTICS_RETENTION_DAYS;
  process.env.ATTRIBUTION_PLACEMENTS_JSON =
    '{"smpn_01_bandung":"SMPN 1 Bandung","smpn_02_bandung":"SMPN 2 Bandung"}';
  stored = null;
  writes = [];
  aggregatePipeline = null;
  reportRows = [];
});

after(() => {
  mock.restoreAll();
  for (const [key, value] of Object.entries({
    ANALYTICS_ENABLED: previous.analyticsEnabled,
    ANALYTICS_RETENTION_DAYS: previous.retentionDays,
    ATTRIBUTION_PLACEMENTS_JSON: previous.placements,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const payload = (overrides = {}) => ({
  visit_id: visitId,
  utm_source: "instagram",
  utm_medium: "story",
  utm_content: "poster",
  has_referrer: false,
  ...overrides,
});

test("validates the supported UTM source-medium pairs and material content", () => {
  for (const [utm_source, utm_medium] of [
    ["whatsapp", "broadcast"],
    ["instagram", "story"],
    ["instagram", "feed"],
    ["tiktok", "story"],
    ["tiktok", "post"],
  ]) {
    assert.equal(parseAttribution(payload({ utm_source, utm_medium })).error, undefined);
  }
  assert.equal(parseAttribution(payload({ utm_source: "instagram", utm_medium: "post" })).error, "utm_source_medium_invalid");
  assert.equal(parseAttribution(payload({ utm_content: "free text" })).error, "utm_content_invalid");
});

test("classifies no-UTM visits as direct only without a referrer, otherwise unknown", () => {
  const direct = parseAttribution({ visit_id: visitId, has_referrer: false });
  assert.equal(direct.attribution.source, "direct");
  assert.equal(direct.attribution.medium, "none");
  const referred = parseAttribution({ visit_id: visitId, has_referrer: true });
  assert.equal(referred.attribution.source, "unknown");
  assert.equal(referred.attribution.medium, "none");
});

test("validates registered school placements and rejects free-form or misplaced codes", () => {
  const school = parseAttribution(payload({
    utm_source: "school_visit",
    utm_medium: "poster_qr",
    utm_campaign: "promosi_nolla",
    utm_content: "poster",
    placement_id: "smpn_01_bandung",
  }));
  assert.equal(school.error, undefined);
  assert.equal(school.attribution.placement_id, "smpn_01_bandung");
  assert.equal(
    parseAttribution(payload({
      utm_source: "school_visit",
      utm_medium: "poster_qr",
      utm_campaign: "promosi_nolla",
      utm_content: "poster",
      placement_id: "sekolah bebas",
    })).error,
    "placement_id_invalid",
  );
  assert.equal(parseAttribution(payload({ placement_id: "smpn_01_bandung" })).error, "placement_id_invalid");
});

test("stores the first source and configured retention only once", async () => {
  const withLocationFields = payload({
    region: { country: "invented" },
    ip: "203.0.113.8",
  });
  assert.equal(parseAttribution(withLocationFields).error, "field_not_allowed");
  assert.equal((await recordFirstTouch(withLocationFields, now)).error, "field_not_allowed");
  assert.equal(stored, null);

  const first = await recordFirstTouch(payload(), now);
  assert.equal(first.status, "accepted");
  assert.equal(first.expires_at.toISOString(), new Date(now.getTime() + 365 * 86400000).toISOString());
  assert.equal(stored.source, "instagram");
  assert.equal(stored.expires_at.getTime() - now.getTime(), 365 * 86400000);
  assert.equal(Object.hasOwn(stored, "region"), false);
  assert.equal(Object.hasOwn(stored, "ip"), false);

  await recordFirstTouch(payload({
    utm_source: "tiktok",
    utm_medium: "post",
    utm_content: "video",
  }), new Date(now.getTime() + 1000));
  assert.equal(stored.source, "instagram");
  assert.equal(stored.medium, "story");
  assert.equal(writes[1].update.$setOnInsert.source, "tiktok");
});

test("keeps placement attribution through pseudonymous registration and stores conversion once", async () => {
  await recordFirstTouch(payload({
    utm_source: "school_visit",
    utm_medium: "poster_qr",
    utm_campaign: "promosi_nolla",
    utm_content: "poster",
    placement_id: "smpn_02_bandung",
  }), now);
  assert.equal(
    await recordRegistrationAttribution(visitId, "66a400000000000000000100"),
    true,
  );
  assert.equal(stored.placement_id, "smpn_02_bandung");
  assert.equal(stored.analytics_user_id, "usr_pseudonymous_test");
  assert.ok(stored.conversions.registration_at instanceof Date);
  const registrationWrite = writes.find((item) =>
    item.update?.$set?.["conversions.registration_at"],
  );
  assert.ok(registrationWrite);
  assert.equal(
    await recordConversion(visitId, "registration", new Date(now.getTime() + 5000)),
    false,
  );
});

test("records quiz conversions once and aggregates all conversion counts per placement", async () => {
  await recordFirstTouch(payload({
    utm_source: "school_visit",
    utm_medium: "poster_qr",
    utm_campaign: "promosi_nolla",
    utm_content: "poster",
    placement_id: "smpn_01_bandung",
  }), now);
  await recordConversion(visitId, "quiz_started", now);
  await recordConversion(visitId, "quiz_completed", now);
  assert.equal(await recordConversion(visitId, "quiz_started", now), false);

  reportRows = [{
    source: "school_visit",
    medium: "poster_qr",
    placement_id: "smpn_01_bandung",
    visits: 20,
    registrations: 8,
    quizzes_started: 5,
    quizzes_completed: 3,
  }];
  const rows = await getAttributionReport(now, new Date(now.getTime() + 86400000));
  assert.deepEqual(
    {
      visits: rows[0].visits,
      registrations: rows[0].registrations,
      quizzes_started: rows[0].quizzes_started,
      quizzes_completed: rows[0].quizzes_completed,
      placement_id: rows[0].placement_id,
      placement_name: rows[0].placement_name,
    },
    {
      visits: 20,
      registrations: 8,
      quizzes_started: 5,
      quizzes_completed: 3,
      placement_id: "smpn_01_bandung",
      placement_name: "SMPN 1 Bandung",
    },
  );
  const group = aggregatePipeline.find((stage) => stage.$group).$group;
  assert.equal(group._id.placement_id, "$placement_id");
  assert.equal(Object.hasOwn(group._id, "region"), false);
  assert.ok(group.registrations && group.quizzes_started && group.quizzes_completed);
});

test("refuses retention shorter than the minimum", async () => {
  process.env.ANALYTICS_RETENTION_DAYS = "364";
  await assert.rejects(
    recordFirstTouch(payload(), now),
    /minimal 365 hari/,
  );
});

test("uses 365 days if the configured retention value is empty", async () => {
  process.env.ANALYTICS_RETENTION_DAYS = "";
  const result = await recordFirstTouch(payload(), now);
  assert.equal(result.expires_at.getTime() - now.getTime(), 365 * 86400000);
});
