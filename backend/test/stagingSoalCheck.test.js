const assert = require("node:assert/strict");
const { test, beforeEach, after, mock } = require("node:test");
const { AppEnvError, getAppEnv, isStagingEnv } = require("../config/appEnv");
const Soal = require("../models/Soal");
const Subbab = require("../models/Subbab");
const Bab = require("../models/Bab");
const Kelas = require("../models/Kelas");
const Jenjang = require("../models/Jenjang");
const StagingSoalCheck = require("../models/StagingSoalCheck");
const { getQuestionContentHash } = require("../utils/questionContent");

// Seluruh akses database diganti; file ini berjalan di proses tersendiri (node --test).
const SUBBAB_ID = "66a400000000000000000010";
const SOAL_A = "66a400000000000000000101";
const SOAL_B = "66a400000000000000000102";
let questions, checks, updates;

const lean = (value) => ({ select: () => lean(value), sort: () => lean(value), lean: async () => value });

let treeData;
const findAll = (key) => () => lean(treeData[key]);
mock.method(Jenjang, "find", findAll("jenjang"));
mock.method(Kelas, "find", findAll("kelas"));
mock.method(Bab, "find", findAll("bab"));
mock.method(Subbab, "find", findAll("subbab"));
mock.method(Subbab, "findById", (id) => lean(id === SUBBAB_ID ? { _id: SUBBAB_ID, name: "Pecahan" } : null));
mock.method(Soal, "find", () => lean(questions));
mock.method(Soal, "findById", (id) => lean(questions.find((q) => q._id === id) ?? null));
mock.method(StagingSoalCheck, "find", () => lean(checks));
mock.method(StagingSoalCheck, "findOne", ({ soal_id: id }) =>
  lean(checks.find((check) => check.soal_id === id) ?? null),
);
mock.method(StagingSoalCheck, "findOneAndUpdate", (filter, update) => {
  updates.push({ filter, update });
  const existing = checks.find((check) => check.soal_id === filter.soal_id) ?? { soal_id: filter.soal_id };
  return lean({ ...existing, ...update.$set });
});

const {
  getCheckTree,
  getSubbabChecks,
  getSoalCheck,
  updateSoalCheck,
} = require("../controllers/stagingSoalCheckController");

const request = (params, body, query = {}) => ({
  params,
  body,
  query,
  protocol: "http",
  get: () => "localhost:5000",
});
const call = async (handler, req) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  await handler(req, res);
  return res;
};

beforeEach(() => {
  updates = [];
  questions = [
    {
      _id: SOAL_A,
      subbab_id: SUBBAB_ID,
      soal_text: "Hitung $\\frac{1}{2}+\\frac{1}{4}$",
      soal_type: "multiple_choice",
      options: [{ option_id: "A", text: "$\\frac{3}{4}$", alasan: "rahasia" }],
      jawaban: "A",
      cognitive_level: "hard",
      image_url: [],
      status: "active",
    },
    { _id: SOAL_B, subbab_id: SUBBAB_ID, soal_text: "Soal B", options: [], jawaban: "B", image_url: [] },
  ];
  checks = [];
});
after(() => mock.restoreAll());

test("APP_ENV: kosong = development, nilai dinormalisasi, nilai salah gagal", () => {
  assert.equal(getAppEnv({}), "development");
  assert.equal(getAppEnv({ APP_ENV: "  " }), "development");
  assert.equal(getAppEnv({ APP_ENV: " Staging " }), "staging");
  assert.equal(isStagingEnv({ APP_ENV: "production" }), false);
  assert.equal(isStagingEnv({}), false);
  assert.throws(() => getAppEnv({ APP_ENV: "stage" }), AppEnvError);
});

test("pintu 1: daftar per subbab memuat label level, kunci, dan ringkasan cek", async () => {
  checks = [
    {
      soal_id: SOAL_A,
      question_check: true,
      question_content_hash: getQuestionContentHash(questions[0]),
      review_check: false,
      review_content_hash: getQuestionContentHash(questions[0]),
    },
  ];
  const res = await call(getSubbabChecks, request({ subbab_id: SUBBAB_ID }));
  assert.equal(res.statusCode, 200);
  const [a, b] = res.body.data.questions;
  assert.equal(a.question_id, SOAL_A);
  assert.equal(a.cognitive_level, "hard");
  assert.equal(a.correct_answer, "A");
  assert.deepEqual(a.options, [{ option_id: "A", text: "$\\frac{3}{4}$" }]);
  assert.deepEqual(a.check.question, { value: true, checked_at: null, stale: false });
  assert.equal(a.check.review.value, false);
  // Level kosong: kuis memakai "medium", nilai asli tetap terlihat null.
  assert.equal(b.cognitive_level, "medium");
  assert.equal(b.stored_cognitive_level, null);
  assert.equal(b.check.question.value, null);
  assert.deepEqual(res.body.data.summary.question, { unchecked: 1, ok: 1, broken: 0, stale: 0 });
  assert.deepEqual(res.body.data.summary.review, { unchecked: 1, ok: 0, broken: 1, stale: 0 });
});

test("pintu 1: id tidak valid 400, subbab tidak ada 404", async () => {
  assert.equal((await call(getSubbabChecks, request({ subbab_id: "x" }))).statusCode, 400);
  assert.equal(
    (await call(getSubbabChecks, request({ subbab_id: "66a400000000000000000099" }))).statusCode,
    404,
  );
});

test("pintu 2: soal diedit setelah ditandai false -> hasil cek usang", async () => {
  checks = [{ soal_id: SOAL_A, review_check: false, review_content_hash: "hash-lama" }];
  const res = await call(getSoalCheck, request({ soal_id: SOAL_A }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.question.check.review.value, false);
  assert.equal(res.body.data.question.check.review.stale, true);
  assert.equal((await call(getSoalCheck, request({ soal_id: "66a400000000000000000199" }))).statusCode, 404);
});

test("update: simpan nilai + hash konten saat ini; null mereset", async () => {
  let res = await call(updateSoalCheck, request({ soal_id: SOAL_A }, { page: "review", value: true }));
  assert.equal(res.statusCode, 200);
  const { $set } = updates[0].update;
  assert.equal($set.review_check, true);
  assert.equal($set.review_content_hash, getQuestionContentHash(questions[0]));
  assert.ok($set.review_checked_at instanceof Date);
  assert.equal($set.subbab_id, SUBBAB_ID);
  assert.equal(res.body.data.question.check.review.stale, false);

  res = await call(updateSoalCheck, request({ soal_id: SOAL_A }, { page: "question", value: null }));
  assert.equal(res.statusCode, 200);
  assert.equal(updates[1].update.$set.question_check, null);
  assert.equal(updates[1].update.$set.question_content_hash, null);
});

test("update: validasi page dan value ketat", async () => {
  for (const body of [{ page: "quiz", value: true }, { page: "review", value: "true" }, {}, undefined]) {
    assert.equal((await call(updateSoalCheck, request({ soal_id: SOAL_A }, body))).statusCode, 400);
  }
  assert.equal(updates.length, 0);
});

test("tree: kelas urut jenjang/nomor, bab & subbab urut display_order, jumlah soal", async () => {
  treeData = {
    jenjang: [{ _id: "j-sd", name: "SD" }, { _id: "j-smp", name: "SMP" }],
    kelas: [
      { _id: "k7", jenjang_id: "j-smp", name: "Kelas 7", nomor_kelas: 7 },
      { _id: "k2", jenjang_id: "j-sd", name: "Kelas 2", nomor_kelas: 2 },
      { _id: "k1", jenjang_id: "j-sd", name: "Kelas 1", nomor_kelas: 1 },
    ],
    bab: [
      { _id: "b2", kelas_id: "k1", name: "Bab B", display_order: 2 },
      { _id: "b1", kelas_id: "k1", name: "Bab A", display_order: 1 },
    ],
    subbab: [
      { _id: "s2", bab_id: "b1", name: "Sub 2", display_order: 2 },
      { _id: "s1", bab_id: "b1", name: "Sub 1", display_order: 1 },
    ],
  };
  // s1: 3 soal -> 1 sudah direview (ok), 1 rusak di review, 1 hasil cek usang.
  const soal = (id) => ({ _id: id, subbab_id: "s1", soal_text: id, options: [], jawaban: "A", image_url: [] });
  questions = [soal("q1"), soal("q2"), soal("q3")];
  const hashOf = (id) => getQuestionContentHash(soal(id));
  checks = [
    { soal_id: "q1", question_check: true, question_content_hash: hashOf("q1"), review_check: true, review_content_hash: hashOf("q1") },
    { soal_id: "q2", question_check: true, question_content_hash: hashOf("q2"), review_check: false, review_content_hash: hashOf("q2") },
    { soal_id: "q3", question_check: false, question_content_hash: "hash-lama", review_check: true, review_content_hash: hashOf("q3") },
  ];
  const res = await call(getCheckTree, request({}));
  assert.equal(res.statusCode, 200);
  const { kelas } = res.body.data;
  assert.deepEqual(kelas.map((k) => [k.name, k.jenjang]), [
    ["Kelas 1", "SD"],
    ["Kelas 2", "SD"],
    ["Kelas 7", "SMP"],
  ]);
  assert.deepEqual(kelas[0].bab.map((b) => b.name), ["Bab A", "Bab B"]);
  assert.deepEqual(kelas[0].bab[0].subbab, [
    { subbab_id: "s1", name: "Sub 1", soal_count: 3, reviewed_count: 2, broken_count: 1 },
    { subbab_id: "s2", name: "Sub 2", soal_count: 0, reviewed_count: 0, broken_count: 0 },
  ]);
  assert.deepEqual(kelas[1].bab, []);
});

test("level: cognitive_score menentukan level seperti di kuis (salinan aturan quizController)", async () => {
  questions = [
    { _id: SOAL_A, subbab_id: SUBBAB_ID, soal_text: "A", options: [], jawaban: "A", image_url: [], cognitive_level: "easy", cognitive_score: 1450 },
    { _id: SOAL_B, subbab_id: SUBBAB_ID, soal_text: "B", options: [], jawaban: "B", image_url: [], cognitive_score: 999 },
  ];
  const res = await call(getSubbabChecks, request({ subbab_id: SUBBAB_ID }));
  const [a, b] = res.body.data.questions;
  assert.equal(a.cognitive_level, "hard");
  assert.equal(a.stored_cognitive_level, "easy");
  assert.equal(b.cognitive_level, "easy");
});

test("pintu 1 filter: review/aprove per halaman, usang = review=0, sequence asli tetap", async () => {
  const soal = (id) => ({ _id: id, subbab_id: SUBBAB_ID, soal_text: id, options: [], jawaban: "A", image_url: [] });
  questions = ["q1", "q2", "q3", "q4"].map(soal);
  const hashOf = (id) => getQuestionContentHash(soal(id));
  checks = [
    // q1: soal ok, review rusak | q2: soal rusak | q3: soal ok tapi usang | q4: belum dicek
    { soal_id: "q1", question_check: true, question_content_hash: hashOf("q1"), review_check: false, review_content_hash: hashOf("q1") },
    { soal_id: "q2", question_check: false, question_content_hash: hashOf("q2") },
    { soal_id: "q3", question_check: true, question_content_hash: "hash-lama" },
  ];
  const ids = async (query) => {
    const res = await call(getSubbabChecks, request({ subbab_id: SUBBAB_ID }, undefined, query));
    assert.equal(res.statusCode, 200);
    return res.body.data.questions.map((q) => `${q.question_id}#${q.sequence}`);
  };

  assert.deepEqual(await ids({}), ["q1#1", "q2#2", "q3#3", "q4#4"]);
  assert.deepEqual(await ids({ review: "1" }), ["q1#1", "q2#2"]);
  assert.deepEqual(await ids({ review: "0" }), ["q3#3", "q4#4"]);
  assert.deepEqual(await ids({ aprove: "1" }), ["q1#1"]);
  assert.deepEqual(await ids({ aprove: "0" }), ["q2#2"]);
  assert.deepEqual(await ids({ review: "1", aprove: "0" }), ["q2#2"]);
  assert.deepEqual(await ids({ review: "0", aprove: "1" }), []);
  // Halaman review memakai review_check.
  assert.deepEqual(await ids({ page: "review", review: "1" }), ["q1#1"]);
  assert.deepEqual(await ids({ page: "review", aprove: "0" }), ["q1#1"]);
  assert.deepEqual(await ids({ page: "review", review: "0" }), ["q2#2", "q3#3", "q4#4"]);

  // Ringkasan tetap untuk seluruh subbab; rusak tidak termasuk yang usang.
  const res = await call(getSubbabChecks, request({ subbab_id: SUBBAB_ID }, undefined, { review: "0" }));
  assert.deepEqual(res.body.data.summary.question, { unchecked: 1, ok: 1, broken: 1, stale: 1 });
  assert.deepEqual(res.body.data.filter, { page: "question", review: false, aprove: null });
});

test("pintu 1 filter: nilai tidak valid -> 400", async () => {
  for (const query of [{ review: "2" }, { aprove: "true" }, { page: "kuis" }]) {
    const res = await call(getSubbabChecks, request({ subbab_id: SUBBAB_ID }, undefined, query));
    assert.equal(res.statusCode, 400, JSON.stringify(query));
  }
});
