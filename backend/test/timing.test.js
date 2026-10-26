const assert = require("node:assert/strict");
const test = require("node:test");
const {
  parseAnswerTiming,
  parseDurationSeconds,
  parseTimingMethod,
} = require("../utils/timing");

test("missing timing stays null instead of zero", () => {
  assert.deepEqual(parseAnswerTiming({}).value, {
    response_time: null,
    response_time_ms: null,
    response_time_partial: null,
  });
  assert.equal(parseDurationSeconds(undefined).value, null);
  assert.equal(parseTimingMethod(null).value, null);
});

test("accepts valid millisecond and legacy second values", () => {
  assert.deepEqual(
    parseAnswerTiming({
      response_time: 2.5,
      response_time_ms: 1500,
      response_time_partial: true,
    }).value,
    { response_time: 2.5, response_time_ms: 1500, response_time_partial: true },
  );
  assert.equal(parseAnswerTiming({ response_time_ms: 0 }).value.response_time_ms, 0);
  assert.equal(parseDurationSeconds(120).value, 120);
  assert.equal(parseTimingMethod("client_visible_v1").value, "client_visible_v1");
});

test("rejects malformed timing input", () => {
  for (const response_time_ms of ["1500", -1, 1.5, Number.NaN, Infinity, 25 * 3600 * 1000]) {
    assert.ok(parseAnswerTiming({ response_time_ms }).error, String(response_time_ms));
  }
  assert.ok(parseAnswerTiming({ response_time: "3" }).error);
  assert.ok(parseAnswerTiming({ response_time_partial: "yes" }).error);
  assert.ok(parseDurationSeconds("120").error);
  assert.ok(parseDurationSeconds(-5).error);
  assert.ok(parseTimingMethod("browser").error);
});
