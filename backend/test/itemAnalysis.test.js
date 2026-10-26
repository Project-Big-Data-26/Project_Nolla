const assert = require("node:assert/strict");
const test = require("node:test");
const { analyzeItemBank, toItemResponses } = require("../services/itemAnalysis");
const { getQuestionContentHash } = require("../utils/questionContent");

const question = {
  _id: "q1",
  subbab_id: "s1",
  soal_text: "1 + 1 = ?",
  soal_type: "multiple_choice",
  options: ["A", "B", "C", "D"].map((option_id) => ({ option_id, text: option_id })),
  jawaban: "B",
  image_url: [],
};
const currentHash = getQuestionContentHash(question);

const attempt = (track, items) => ({
  cognitive_level: track,
  soal: items.map(([soalId, answer, isCorrect, ms, hash = currentHash]) => ({
    soal_id: soalId,
    pilihan_jawaban: answer,
    is_correct: isCorrect,
    kunci_jawaban: "B",
    response_time_ms: ms,
    content_hash: hash,
  })),
});

test("maps attempts to anonymous item responses with attempt totals", () => {
  const rows = toItemResponses([
    attempt("medium", [["q1", "B", true, 1200], ["q2", "A", false, null]]),
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].totalScore, 1);
  assert.equal(rows[0].formLength, 2);
  assert.equal(rows[1].responseTimeMs, null);
  for (const row of rows) {
    assert.deepEqual(
      Object.keys(row).sort(),
      ["contentVersion", "correctOptionId", "formLength", "isCorrect", "questionId", "responseTimeMs", "selectedAnswer", "timingPartial", "totalScore", "track"],
    );
  }
});

test("segments by track and content version so totals stay comparable", () => {
  const rows = toItemResponses([
    attempt("medium", [["q1", "B", true, 1000], ["q2", "B", true, 1000]]),
    attempt("medium", [["q1", "A", false, 2000], ["q2", "B", true, 1000]]),
    attempt("hard", [["q1", "B", true, 3000], ["q3", "C", false, 1000]]),
    attempt("medium", [["q1", "B", true, 4000, "old-hash"], ["q2", "B", true, 1000]]),
    attempt("medium", [["q1", "B", true, 4000, null], ["q2", "B", true, 1000]]),
  ]);
  const segments = analyzeItemBank(rows, new Map([["q1", question]])).filter(
    (segment) => segment.question_id === "q1",
  );
  assert.equal(segments.length, 4);

  const current = segments.find((s) => s.track === "medium" && s.is_current_version);
  assert.equal(current.response_count, 2);
  assert.equal(current.analysis.difficultyIndex, 0.5);
  assert.deepEqual(Object.keys(current.analysis.optionSelection), ["A", "B", "C", "D"]);

  assert.ok(segments.find((s) => s.track === "hard"));
  assert.ok(segments.find((s) => s.content_version === "old-hash").review_flags.includes("content_changed_since"));
  assert.ok(segments.find((s) => s.content_version === "unknown").review_flags.includes("content_version_unknown"));
});

test("flags deleted questions, filters small segments, and survives all-rapid-guess segments", () => {
  const rows = toItemResponses([
    attempt("easy", [["gone", "B", true, 100]]),
    attempt("easy", [["q1", "B", true, 100]]),
  ]);
  const all = analyzeItemBank(rows, new Map([["q1", question]]), { rapidGuessThresholdMs: 3000 });
  assert.ok(all.find((s) => s.question_id === "gone").review_flags.includes("question_deleted"));
  const rapid = all.find((s) => s.question_id === "q1");
  assert.equal(rapid.analysis, null);
  assert.ok(rapid.review_flags.includes("no_valid_response"));

  assert.equal(analyzeItemBank(rows, new Map([["q1", question]]), { minResponses: 2 }).length, 0);
});
