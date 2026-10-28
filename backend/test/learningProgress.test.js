const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getBabProgress,
  getCognitiveLevel,
  getSubbabProgress,
  isSubbabMastered,
  MASTERY_RATING_THRESHOLD,
} = require("../utils/learningProgress");

test("maps cognitive scores to subbab progress percentages", () => {
  assert.equal(getSubbabProgress(600), 0);
  assert.equal(getSubbabProgress(1100), 50);
  assert.equal(getSubbabProgress(1600), 100);
  assert.equal(getSubbabProgress(Number.NaN), 0);
});

test("counts unquizzed subbab as zero in the BAB progress average", () => {
  const subbabList = [
    { _id: "first" },
    { _id: "second" },
    { _id: "not-quizzed" },
  ];
  const difficultyBySubbabId = new Map([
    ["first", { current_cognitive_score: 1600 }],
    ["second", { current_cognitive_score: 1100 }],
    ["not-quizzed", { current_cognitive_score: 1600 }],
  ]);

  assert.equal(
    getBabProgress(
      subbabList,
      difficultyBySubbabId,
      new Set(["first", "second"]),
    ),
    50,
  );
  assert.equal(
    getBabProgress(subbabList, difficultyBySubbabId, new Set()),
    0,
  );
  assert.equal(
    getBabProgress([], difficultyBySubbabId, new Set()),
    0,
  );
});

test("uses the shared cognitive level and completion thresholds", () => {
  assert.equal(getCognitiveLevel(1400), "hard");
  assert.equal(getCognitiveLevel(1000), "medium");
  assert.equal(getCognitiveLevel(999), "easy");
  assert.equal(isSubbabMastered(MASTERY_RATING_THRESHOLD, true), true);
  assert.equal(isSubbabMastered(1599, true), false);
});

test("mastery requires a submitted quiz, not only a high rating", () => {
  assert.equal(isSubbabMastered(1700, false), false);
  assert.equal(isSubbabMastered("1650", true), true);
  assert.equal(isSubbabMastered(undefined, true), false);
  assert.equal(isSubbabMastered(null, true), false);
});
