const assert = require("node:assert/strict");
const test = require("node:test");
const {
  FREE_QUIZ_SESSIONS_PER_SUBBAB,
  TRIAL_DURATION_MS,
  pickLockedBabIds,
  planLimitHitEvent,
  resolveEntitlement,
} = require("../services/entitlement");

const NOW = new Date("2026-11-03T10:00:00Z");
const hours = (value) => new Date(NOW.getTime() + value * 60 * 60 * 1000);
const period = (source, startHours, endHours, extra = {}) => ({
  source,
  starts_at: hours(startHours),
  ends_at: hours(endHours),
  cancelled_at: null,
  ...extra,
});

test("user without periods is free with trial available", () => {
  assert.deepEqual(resolveEntitlement([], NOW), {
    plan: "free",
    is_trial: false,
    package: null,
    active_until: null,
    trial: { available: true, started_at: null, ends_at: null },
    limits: { quiz_sessions_per_subbab: FREE_QUIZ_SESSIONS_PER_SUBBAB },
  });
});

test("active trial is premium labelled as trial without quiz limit", () => {
  const trial = period("trial", -1, 71);
  const result = resolveEntitlement([trial], NOW);
  assert.equal(result.plan, "premium");
  assert.equal(result.is_trial, true);
  assert.deepEqual(result.active_until, trial.ends_at);
  assert.equal(result.trial.available, false);
  assert.equal(result.limits.quiz_sessions_per_subbab, null);
});

test("trial lasts 72 hours", () => {
  assert.equal(TRIAL_DURATION_MS, 72 * 60 * 60 * 1000);
});

test("expired trial falls back to free and cannot be reused", () => {
  const result = resolveEntitlement([period("trial", -80, -8)], NOW);
  assert.equal(result.plan, "free");
  assert.equal(result.is_trial, false);
  assert.equal(result.trial.available, false);
  assert.equal(result.limits.quiz_sessions_per_subbab, FREE_QUIZ_SESSIONS_PER_SUBBAB);
});

test("ends_at is exclusive and future periods are not active yet", () => {
  assert.equal(resolveEntitlement([period("manual", -5, 0)], NOW).plan, "free");
  assert.equal(resolveEntitlement([period("manual", 1, 5)], NOW).plan, "free");
  assert.equal(resolveEntitlement([period("manual", 0, 5)], NOW).plan, "premium");
});

test("cancelled period grants nothing but a cancelled trial is still used", () => {
  const result = resolveEntitlement(
    [period("trial", -1, 71, { cancelled_at: hours(-0.5) })],
    NOW,
  );
  assert.equal(result.plan, "free");
  assert.equal(result.trial.available, false);
});

test("manual premium overlapping a trial is not labelled trial", () => {
  const result = resolveEntitlement(
    [period("trial", -1, 71), period("manual", -2, 720)],
    NOW,
  );
  assert.equal(result.plan, "premium");
  assert.equal(result.is_trial, false);
  assert.deepEqual(result.active_until, hours(720));
});

test("package comes from the latest active non-trial period", () => {
  assert.equal(resolveEntitlement([period("trial", -1, 71)], NOW).package, null);
  assert.equal(
    resolveEntitlement(
      [
        period("trial", -1, 71),
        period("manual", -2, 100, { package: "weekly" }),
        period("payment", -1, 700, { package: "monthly" }),
        period("payment", -400, -10, { package: "yearly" }),
      ],
      NOW,
    ).package,
    "monthly",
  );
  assert.equal(resolveEntitlement([period("manual", -2, 100)], NOW).package, null);
  assert.equal(resolveEntitlement([period("manual", -200, -2, { package: "yearly" })], NOW).package, null);
});

test("locks the highest display_order bab in each kelas", () => {
  const locked = pickLockedBabIds([
    { _id: "a1", kelas_id: "A", display_order: 1 },
    { _id: "a3", kelas_id: "A", display_order: 3 },
    { _id: "a2", kelas_id: "A", display_order: 2 },
    { _id: "b1", kelas_id: "B", display_order: 1 },
  ]);
  assert.deepEqual([...locked].sort(), ["a3", "b1"]);
});

test("ties at the highest order are all locked; missing orders are ignored", () => {
  const locked = pickLockedBabIds([
    { _id: "a1", kelas_id: "A", display_order: 2 },
    { _id: "a2", kelas_id: "A", display_order: 2 },
    { _id: "a0", kelas_id: "A", display_order: null },
    { _id: "c1", kelas_id: "C" },
    { _id: "c2", kelas_id: "C", display_order: null },
  ]);
  assert.deepEqual([...locked].sort(), ["a1", "a2"]);
});

test("plan_limit_hit carries only ids, counts and enums", () => {
  const entitlement = resolveEntitlement([period("trial", -80, -8)], NOW);
  assert.deepEqual(
    planLimitHitEvent({
      reason: "quiz_limit",
      surface: "quiz_start",
      entitlement,
      babId: { toString: () => "b".repeat(24) },
      subbabId: "c".repeat(24),
      used: 3,
    }),
    {
      name: "plan_limit_hit",
      properties: {
        reason: "quiz_limit",
        surface: "quiz_start",
        bab_id: "b".repeat(24),
        subbab_id: "c".repeat(24),
        sessions_used: 3,
        trial_available: false,
      },
    },
  );
  const pretest = planLimitHitEvent({
    reason: "locked_bab",
    surface: "pretest_start",
    entitlement: resolveEntitlement([], NOW),
    babId: "b".repeat(24),
  });
  assert.equal(pretest.properties.subbab_id, null);
  assert.equal(pretest.properties.sessions_used, null);
  assert.equal(pretest.properties.trial_available, true);
});
