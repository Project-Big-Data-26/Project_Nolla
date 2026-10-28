const assert = require("node:assert/strict");
const test = require("node:test");
const { validateBrowserEvent } = require("../services/analyticsEventSchema");

const now = new Date("2026-10-26T08:00:00.000Z");
const attemptId = "66a400000000000000000001";
const questionId = "66a400000000000000000002";

const viewed = (overrides = {}) => ({
  event_id: "e7d0cb82-9df4-46fb-98cf-234e236c17a9",
  event_name: "question_viewed",
  schema_version: 1,
  occurred_at: "2026-10-26T07:59:59.000Z",
  learning_session_id: "learn_abcdef12",
  page_instance_id: "page_abcdef12",
  assessment_type: "quiz",
  assessment_attempt_id: attemptId,
  properties: { question_id: questionId, sequence: 4, view_id: "view_abcdef12" },
  ...overrides,
});

const reasonOf = (raw) => validateBrowserEvent(raw, now).reason;

test("accepts a valid allowlisted event and normalizes it", () => {
  const { event, reason } = validateBrowserEvent(viewed(), now);
  assert.equal(reason, undefined);
  assert.equal(event.event_name, "question_viewed");
  assert.equal(event.occurred_at.toISOString(), "2026-10-26T07:59:59.000Z");
  assert.deepEqual(event.quality_flags, []);
});

test("rejects identity, source, and unknown envelope fields from the client", () => {
  assert.equal(reasonOf(viewed({ event_source: "server" })), "field_not_allowed:event_source");
  assert.equal(reasonOf(viewed({ analytics_user_id: "usr_x" })), "field_not_allowed:analytics_user_id");
  assert.equal(reasonOf(viewed({ received_at: now.toISOString() })), "field_not_allowed:received_at");
});

test("rejects server-only and unknown event names", () => {
  assert.equal(reasonOf(viewed({ event_name: "assessment_completed" })), "event_name_not_allowed");
  assert.equal(reasonOf(viewed({ event_name: "rating_updated" })), "event_name_not_allowed");
  assert.equal(reasonOf(viewed({ event_name: "console_log" })), "event_name_not_allowed");
});

test("rejects properties that could carry credentials or free text", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEifQ.c2lnbmF0dXJl";
  assert.equal(
    reasonOf(viewed({ properties: { question_id: questionId, sequence: 1, view_id: jwt } })),
    "property_invalid:view_id",
  );
  assert.equal(
    reasonOf(viewed({ properties: { question_id: questionId, sequence: 1, view_id: "view_abcdef12", url: "/x?accessToken=a" } })),
    "property_not_allowed:url",
  );
  assert.equal(
    reasonOf(viewed({ event_name: "page_viewed", assessment_type: undefined, assessment_attempt_id: undefined, route_name: "/login?token=a", properties: {} })),
    "route_name_invalid",
  );
  assert.equal(reasonOf(viewed({ learning_session_id: "a".repeat(65) })), "learning_session_id_invalid");
});

test("validates timestamps, schema version, ids, and attempt requirements", () => {
  assert.equal(reasonOf(viewed({ occurred_at: "kemarin" })), "occurred_at_invalid");
  assert.equal(reasonOf(viewed({ occurred_at: "2026-10-26T08:10:00.000Z" })), "occurred_at_out_of_range");
  assert.equal(reasonOf(viewed({ occurred_at: "2026-10-10T08:00:00.000Z" })), "occurred_at_out_of_range");
  assert.equal(reasonOf(viewed({ schema_version: 2 })), "schema_version_unsupported");
  assert.equal(reasonOf(viewed({ event_id: "123" })), "event_id_invalid");
  assert.equal(reasonOf(viewed({ assessment_type: undefined, assessment_attempt_id: undefined })), "assessment_attempt_required");
  assert.equal(reasonOf(viewed({ assessment_type: "exam" })), "assessment_type_invalid");
  assert.equal(
    reasonOf({ ...viewed(), event_name: "topic_selected", properties: { bab_id: questionId } }),
    "field_not_allowed:assessment_attempt_id",
  );
});

test("validates property types, ranges, and required fields", () => {
  assert.equal(
    reasonOf(viewed({ properties: { question_id: questionId, view_id: "view_abcdef12" } })),
    "property_required:sequence",
  );
  assert.equal(
    reasonOf(viewed({ properties: { question_id: questionId, sequence: "4", view_id: "view_abcdef12" } })),
    "property_invalid:sequence",
  );
  assert.equal(
    reasonOf({
      ...viewed(),
      event_name: "question_timing_recorded",
      properties: {
        question_id: questionId, sequence: 1, view_id: "view_abcdef12", interval_seq: 1,
        visible_time_ms: -5, timing_method: "client_visible_v1",
      },
    }),
    "property_invalid:visible_time_ms",
  );
  const nullActive = validateBrowserEvent({
    ...viewed(),
    event_name: "question_timing_recorded",
    properties: {
      question_id: questionId, sequence: 1, view_id: "view_abcdef12", interval_seq: 1,
      visible_time_ms: 1500, active_time_ms: null, timing_method: "client_visible_v1",
    },
  }, now);
  assert.equal(nullActive.reason, undefined, "null berarti tidak diketahui, bukan nol");
});

test("adds clock_skew flag and rejects unknown quality flags", () => {
  const skewed = validateBrowserEvent(viewed({ occurred_at: "2026-10-26T07:50:00.000Z" }), now);
  assert.deepEqual(skewed.event.quality_flags, ["clock_skew"]);
  assert.equal(reasonOf(viewed({ quality_flags: ["legacy_unit_assumed"] })), "quality_flags_invalid");
});
