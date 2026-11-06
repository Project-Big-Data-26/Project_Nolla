const assert = require("node:assert/strict");
const { test, beforeEach, after, mock } = require("node:test");
const Bab = require("../models/Bab");
const Subbab = require("../models/Subbab");
const Soal = require("../models/Soal");
const Relations = require("../models/MemilikiPrasyarat");
const Pretest = require("../models/MengerjakanPretest");
const Answers = require("../models/MenjawabSoalPretest");
const entitlementService = require("../services/entitlement");
const analytics = require("../services/analyticsService");

// Semua boundary database dan event diganti; tidak ada koneksi/seed database.
const BAB = "66a200000000000000000001";
const PREREQUISITE = "66a200000000000000000002";
const OTHER_PREREQUISITE = "66a200000000000000000003";
const SUB_A = "66a300000000000000000001";
const SUB_B = "66a300000000000000000002";
const PRE_FIRST = "66a300000000000000000003";
const PRE_LAST = "66a300000000000000000004";
const ATTEMPT = "66a400000000000000000001";
const USER = "66a100000000000000000001";
let subbabs, relations, questions, records, existing, stored, created, events;
let locked, chapterExists, questionReads, answerReads, questionQuery, idCounter;

const query = (value) => ({
  select() { return this; }, sort() { return this; }, populate() { return this; },
  async lean() { return value; },
});
mock.method(Bab, "findById", () => query(chapterExists ? { _id: BAB } : null));
mock.method(Relations, "find", () => query(relations));
mock.method(Subbab, "find", (filter) => query(subbabs.filter(
  (item) => filter.bab_id.$in.map(String).includes(String(item.bab_id)),
)));
mock.method(Soal, "find", (filter) => {
  questionReads++;
  questionQuery = filter;
  return query(questions.filter((item) => filter.subbab_id.$in.map(String).includes(String(item.subbab_id))
    && item.status !== "inactive"));
});
mock.method(Soal, "findById", (id) => query(questions.find((item) => String(item._id) === String(id))));
mock.method(Pretest, "findOne", () => query(existing));
mock.method(Pretest, "create", async (payload) => {
  created.push(payload);
  stored = { ...payload, _id: ATTEMPT };
  return stored;
});
mock.method(Pretest, "findById", () => query(stored));
mock.method(Pretest, "findByIdAndUpdate", async (id, fields) => Object.assign(stored, fields));
mock.method(Pretest, "updateOne", async (filter, update) => {
  if (String(filter.current_question_id) !== String(stored.current_question_id)) return { matchedCount: 0 };
  Object.assign(stored, update.$set);
  return { matchedCount: 1 };
});
mock.method(Answers, "find", () => {
  answerReads++;
  let populated = false;
  const result = query(records);
  result.populate = function () { populated = true; return this; };
  result.lean = async () => records.map((record) => ({
    ...record,
    soal_id: populated
      ? questions.find((item) => item._id === String(record.soal_id?._id ?? record.soal_id))
      : record.soal_id?._id ?? record.soal_id,
  }));
  return result;
});
mock.method(Answers, "findOne", (filter) => query(records.find(
  (record) => String(record.soal_id?._id ?? record.soal_id) === String(filter.soal_id),
) ?? null));
mock.method(Answers, "countDocuments", async () => records.length);
mock.method(Answers, "create", async (payload) => {
  const record = { ...payload, _id: `66a60000${String(records.length + 1).padStart(16, "0")}` };
  records.push(record);
  return record;
});
mock.method(entitlementService, "getEntitlement", async () => ({
  plan: "free", is_trial: false, trial: { available: true },
  limits: { quiz_sessions_per_subbab: 3 },
}));
mock.method(entitlementService, "isBabLocked", async () => locked);
mock.method(analytics, "recordServerEvents", async (context, batch) => events.push(...batch));
mock.method(analytics, "recordApplicationError", async () => {});

const { checkPretestAvailability, getPretestDifficulty } = require("../services/pretestAvailability");
const {
  startPretest, getNextQuestion, answerPretestQuestion, getExpectedQuestionBudget,
} = require("../controllers/pretestController");

const question = (subbabId, difficulty, extra = {}) => ({
  _id: `66a50000${String(++idCounter).padStart(16, "0")}`,
  subbab_id: subbabId,
  cognitive_score: { easy: 600, medium: 1000, hard: 1400 }[difficulty],
  cognitive_level: difficulty,
  status: "active", soal_text: "Fixture question", jawaban: "A",
  options: [{ option_id: "A", text: "Pilihan A" }, { option_id: "B", text: "Pilihan B" }], image_url: [],
  ...extra,
});
const completeSubbab = (id) => ["easy", "medium", "hard"].map((level) => question(id, level));
const call = async (handler, req = {}) => {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler({
    user: { id: USER }, body: { bab_id: BAB }, params: {},
    protocol: "http", get: () => "localhost:5000", ...req,
  }, res);
  return res;
};

beforeEach(() => {
  idCounter = 0;
  subbabs = [
    { _id: SUB_B, bab_id: BAB, display_order: 2 },
    { _id: SUB_A, bab_id: BAB, display_order: 1 },
    { _id: PRE_FIRST, bab_id: PREREQUISITE, display_order: 1 },
    { _id: PRE_LAST, bab_id: PREREQUISITE, display_order: 2 },
  ];
  relations = [{ relasi_bab_id: PREREQUISITE }];
  questions = [...completeSubbab(SUB_A), ...completeSubbab(SUB_B), question(PRE_LAST, "hard")];
  records = []; created = []; events = []; existing = null; stored = null;
  locked = false; chapterExists = true; questionReads = 0; answerReads = 0;
  questionQuery = null;
});
after(() => mock.restoreAll());

test("kelengkapan: satu hard prasyarat dan tiga level setiap subbab menghasilkan target lima soal", async () => {
  const result = await checkPretestAvailability(BAB);
  assert.equal(result.can_start, true);
  assert.equal(result.total_questions, 5);
  assert.deepEqual(result.missing_requirements, []);
  assert.deepEqual(result.pool.subbabIds, [SUB_A, SUB_B]);
  assert.equal(result.pool.prerequisiteQuestions[0].subbab_id, PRE_LAST);
  assert.deepEqual(questionQuery.status, { $ne: "inactive" });
});

test("ObjectId huruf besar tetap merujuk bab yang sama", async () => {
  const res = await call(startPretest, { body: { bab_id: BAB.toUpperCase() } });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.total_questions, 5);
  assert.equal(created.length, 1);
});

for (const level of ["easy", "medium", "hard"]) {
  test(`start: kekurangan ${level} pada satu subbab menolak sebelum writer sesi/event`, async () => {
    questions = questions.filter((item) => item.subbab_id !== SUB_B || item.cognitive_level !== level);
    const res = await call(startPretest);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, "PRETEST_QUESTIONS_INCOMPLETE");
    assert.equal(res.body.data.can_start, false);
    assert.equal(res.body.data.total_questions, 5);
    assert.deepEqual(res.body.data.missing_requirements, [{
      stage: "subbab", bab_id: BAB, subbab_id: SUB_B, difficulty: level,
      required: 1, available: 0, reason: "missing_question",
    }]);
    assert.equal(created.length, 0);
    assert.equal(events.length, 0);
    assert.equal(answerReads, 0);
    assert.equal("pool" in res.body.data, false);
    assert.equal(JSON.stringify(res.body).includes("Fixture question"), false);
    assert.equal(JSON.stringify(res.body).includes("jawaban"), false);
  });
}

test("subbab kosong tetap diperiksa walaupun subbab lain lengkap", async () => {
  questions = questions.filter((item) => item.subbab_id !== SUB_B);
  const result = await checkPretestAvailability(BAB);
  assert.equal(result.can_start, false);
  assert.deepEqual(result.missing_requirements.map((item) => item.difficulty), ["easy", "medium", "hard"]);
  assert.equal(result.total_questions, 5);
});

test("prasyarat: hard di subbab sebelumnya dan medium 1399 di subbab terakhir tidak cukup", async () => {
  questions = questions.filter((item) => item.subbab_id !== PRE_LAST);
  questions.push(question(PRE_FIRST, "hard"), question(PRE_LAST, "hard", { cognitive_score: 1399 }));
  const res = await call(startPretest);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.data.missing_requirements, [{
    stage: "prerequisite", bab_id: PREREQUISITE, subbab_id: PRE_LAST,
    difficulty: "hard", required: 1, available: 0, reason: "missing_question",
  }]);
  assert.equal(res.body.data.total_questions, 5);
  assert.equal(created.length, 0);
  assert.equal(events.length, 0);
  assert.equal(questionQuery.subbab_id.$in.includes(PRE_FIRST), false);
});

test("prasyarat tanpa subbab tidak dihilangkan dari target", async () => {
  subbabs = subbabs.filter((item) => item.bab_id !== PREREQUISITE);
  const res = await call(startPretest);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.data.total_questions, 5);
  assert.equal(res.body.data.missing_requirements[0].reason, "missing_subbab");
  assert.equal(res.body.data.missing_requirements[0].subbab_id, null);
  assert.equal(created.length, 0);
});

test("setiap prasyarat harus lengkap, bukan cukup salah satunya", async () => {
  relations.push({ relasi_bab_id: OTHER_PREREQUISITE });
  const result = await checkPretestAvailability(BAB);
  assert.equal(result.can_start, false);
  assert.equal(result.total_questions, 6);
  assert.equal(result.pool.prerequisiteQuestions.length, 1);
  assert.equal(result.missing_requirements[0].bab_id, OTHER_PREREQUISITE);
});

test("soal inactive tidak memenuhi syarat level", async () => {
  questions.find((item) => item.subbab_id === PRE_LAST).status = "inactive";
  const res = await call(startPretest);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.data.missing_requirements[0].stage, "prerequisite");
  assert.equal(created.length, 0);
});

test("tanpa relasi prasyarat boleh langsung subbab; bab tanpa subbab ditolak", async () => {
  relations = [];
  const res = await call(startPretest);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.stage, "subbab");
  assert.equal(res.body.data.total_questions, 4);
  assert.equal(getPretestDifficulty(questions.find((item) => item._id === res.body.data.first_question.question_id)), "medium");
  subbabs = [];
  const result = await checkPretestAvailability(BAB);
  assert.equal(result.can_start, false);
  assert.equal(result.total_questions, 0);
  assert.equal(result.missing_requirements[0].reason, "missing_subbab");
});

test("relasi prasyarat ke bab sendiri ditolak", async () => {
  relations = [{ relasi_bab_id: BAB }];
  const res = await call(startPretest);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.data.missing_requirements[0].reason, "invalid_prerequisite");
  assert.equal(created.length, 0);
});

test("level efektif: ambang score konsisten, fallback hanya ke label valid", () => {
  for (const [score, level] of [[999, "easy"], [1000, "medium"], [1200, "medium"], [1399, "medium"], [1400, "hard"]]) {
    assert.equal(getPretestDifficulty({ cognitive_score: score, cognitive_level: "easy" }), level);
  }
  assert.equal(getPretestDifficulty({ cognitive_score: null, cognitive_level: "hard" }), "hard");
  assert.equal(getPretestDifficulty({ cognitive_level: "medium" }), "medium");
  for (const score of [null, undefined, "", " ", false, NaN, Infinity]) {
    assert.equal(getPretestDifficulty({ cognitive_score: score }), null);
  }
});

test("metadata level kosong tidak mencukupi stok easy; label valid tanpa score boleh dipakai", async () => {
  const easy = questions.find((item) => item.subbab_id === SUB_A && item.cognitive_level === "easy");
  delete easy.cognitive_score;
  delete easy.cognitive_level;
  assert.equal((await call(startPretest)).statusCode, 400);
  easy.cognitive_level = "easy";
  assert.equal((await call(startPretest)).statusCode, 201);
});

test("start lengkap: hanya satu pembacaan pool, pointer soal hard disimpan bersama sesi", async () => {
  const res = await call(startPretest);
  assert.equal(res.statusCode, 201);
  assert.equal(created.length, 1);
  assert.equal(questionReads, 1);
  assert.equal(answerReads, 0);
  assert.equal(String(created[0].current_question_id), res.body.data.first_question.question_id);
  assert.equal(res.body.data.stage, "prerequisite");
  assert.equal(res.body.data.first_question.subbab_id, PRE_LAST);
  assert.equal(res.body.data.first_question.cognitive_score, 1400);
  assert.equal("jawaban" in res.body.data.first_question, false);
  assert.deepEqual(events.map((event) => event.name), ["assessment_started", "question_assigned"]);
  assert.equal(events[0].properties.planned_question_count, 5);
});

test("alur jawaban lengkap: hard prasyarat → medium/hard → medium/easy, lima soal berbeda", async () => {
  const start = await call(startPretest);
  assert.equal(start.statusCode, 201);
  let next = start.body.data.first_question;
  const levels = [];
  const ids = [];
  for (const answer of ["A", "A", "A", "B", "A"]) {
    assert.ok(next);
    ids.push(next.question_id);
    levels.push(getPretestDifficulty(questions.find((item) => item._id === next.question_id)));
    const result = await call(answerPretestQuestion, {
      params: { pretestId: ATTEMPT },
      body: { question_id: next.question_id, selected_answer: answer },
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.data.total_questions, 5);
    assert.equal(result.body.data.is_correct, answer === "A");
    next = result.body.data.next_question;
    assert.equal(result.body.data.is_last_question, ids.length === 5);
  }
  assert.equal(next, null);
  assert.equal(new Set(ids).size, 5);
  assert.deepEqual(levels, ["hard", "medium", "hard", "medium", "easy"]);
  assert.deepEqual(records.map((item) => item.sequence), [1, 2, 3, 4, 5]);
  assert.deepEqual(records.map((item) => item.stage), ["prerequisite", "subbab", "subbab", "subbab", "subbab"]);
  assert.equal(events.filter((event) => event.name === "assessment_started").length, 1);
});

for (const correct of [true, false]) {
  test(`adaptif: medium pertama ${correct ? "benar → hard" : "salah → easy"}, lalu medium subbab berikutnya`, async () => {
    relations = [];
    await call(startPretest);
    const first = questions.find((item) => item._id === String(stored.current_question_id));
    assert.equal(getPretestDifficulty(first), "medium");
    records.push({ soal_id: first, is_correct: correct, sequence: 1 });
    stored.current_question_id = null;
    let res = await call(getNextQuestion, { params: { pretestId: ATTEMPT } });
    assert.equal(res.statusCode, 200);
    const second = questions.find((item) => item._id === res.body.data.question.question_id);
    assert.equal(getPretestDifficulty(second), correct ? "hard" : "easy");
    assert.notEqual(second._id, first._id);
    assert.equal(second.subbab_id, first.subbab_id);
    records.push({ soal_id: second, is_correct: true, sequence: 2 });
    stored.current_question_id = null;
    res = await call(getNextQuestion, { params: { pretestId: ATTEMPT } });
    assert.equal(res.body.data.question.subbab_id, SUB_B);
    assert.equal(res.body.data.question.cognitive_score, 1000);
    assert.equal(res.body.data.sequence, 3);
    assert.equal(res.body.data.total_questions, 4);
  });
}

for (const completed of [false, true]) {
  test(`sesi ${completed ? "selesai" : "aktif"} tetap 409 tanpa pengecekan/pembuatan baru`, async () => {
    existing = { _id: ATTEMPT, completed_at: completed ? new Date() : null };
    questions = [];
    locked = true;
    const res = await call(startPretest);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.data.status, completed ? "completed" : "in_progress");
    assert.equal(questionReads, 0);
    assert.equal(created.length, 0);
    assert.equal(events.length, 0);
  });
}

test("bab terkunci tetap 403 PREMIUM_REQUIRED sebelum pemeriksaan stok", async () => {
  locked = true;
  const res = await call(startPretest);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "PREMIUM_REQUIRED");
  assert.equal(questionReads, 0);
  assert.equal(created.length, 0);
  assert.equal(events.some((event) => event.name === "assessment_started"), false);
});

test("input salah dan bab hilang mempertahankan 400/404 tanpa write", async () => {
  assert.equal((await call(startPretest, { body: { bab_id: "invalid" } })).statusCode, 400);
  chapterExists = false;
  assert.equal((await call(startPretest)).statusCode, 404);
  assert.equal(questionReads, 0);
  assert.equal(created.length, 0);
});

test("budget dihitung dari seluruh relasi/subbab walaupun stok prasyarat kosong", async () => {
  questions = [];
  assert.deepEqual(await getExpectedQuestionBudget(BAB), {
    prerequisiteQuestionLimit: 1, subbabCount: 2, totalQuestions: 5,
  });
});
