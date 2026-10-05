const assert = require("node:assert/strict");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const EMAIL = process.env.TEST_EMAIL || "student@example.com";
const PASSWORD = process.env.TEST_PASSWORD || "12345678";
const BAB_NAME = (process.env.TEST_BAB_NAME || "Peluang").toLowerCase();
const SUBBAB_INDEX = Number(process.env.TEST_SUBBAB_INDEX || 0);
const DEFAULT_ANSWER = process.env.QUIZ_ANSWER || "B";

const redactSecrets = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactSecrets);

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      ["accessToken", "refreshToken"].includes(key)
        ? "<redacted>"
        : redactSecrets(item),
    ]),
  );
};

const request = async (method, path, token, body) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const responseBody = await response.json().catch(() => null);

  console.log(`\n>>> ${method} ${path}`);
  console.log(`<<< ${response.status}`);
  console.log(JSON.stringify(redactSecrets(responseBody), null, 2));

  return { status: response.status, body: responseBody };
};

const expectStatus = (result, expectedStatus) => {
  assert.equal(
    result.status,
    expectedStatus,
    `Expected HTTP ${expectedStatus}, received ${result.status}`,
  );
};

const assertQuestionPayload = (question) => {
  assert.ok(question, "Question tidak boleh kosong");
  assert.match(question.question_id, /^[a-f0-9]{24}$/i);
  assert.equal(typeof question.question_text, "string");
  assert.ok(question.question_text.length > 0);
  assert.ok(Array.isArray(question.options));
  assert.ok(
    ["easy", "medium", "hard"].includes(question.cognitive_level),
    `Difficulty tidak valid: ${question.cognitive_level}`,
  );
  assert.equal("correct_answer" in question, false);
  assert.equal("jawaban_benar" in question, false);
};

const getTargetSubbab = (body) => {
  const bab = body?.data?.find((item) => item.name?.toLowerCase() === BAB_NAME);
  assert.ok(bab, `Bab ${BAB_NAME} tidak ditemukan`);
  assert.equal(bab.has_pretest, true, "Pretest bab target harus sudah selesai");
  assert.ok(Array.isArray(bab.subbab), "Bab target harus memiliki subbab");
  assert.ok(
    bab.subbab[SUBBAB_INDEX],
    "Subbab index yang dipilih tidak ditemukan",
  );

  return {
    bab,
    subbab: bab.subbab[SUBBAB_INDEX],
  };
};

const run = async () => {
  assert.ok(
    Number.isInteger(SUBBAB_INDEX) && SUBBAB_INDEX >= 0,
    "TEST_SUBBAB_INDEX harus berupa bilangan bulat 0 atau lebih",
  );

  const login = await request("POST", "/api/auth/login", null, {
    email: EMAIL,
    password: PASSWORD,
  });
  expectStatus(login, 200);

  const accessToken = login.body?.data?.accessToken;
  assert.ok(accessToken, "Login tidak mengembalikan accessToken");

  const babResponse = await request(
    "GET",
    "/api/dashboard/bab?kelas=12",
    accessToken,
  );
  expectStatus(babResponse, 200);

  const { bab, subbab } = getTargetSubbab(babResponse.body);
  console.log(`\nTarget quiz: ${bab.name} / ${subbab.name} (${subbab.id})`);
  const start = await request("POST", "/api/quiz/start", accessToken, {
    subbab_id: subbab.id,
  });
  assert.ok(
    [200, 201].includes(start.status),
    `Expected HTTP 200 or 201, received ${start.status}`,
  );

  const startData = start.body?.data;
  assert.ok(startData?.session_id, "Start quiz tidak mengembalikan session_id");
  assert.equal(startData.subbab_id.toString(), subbab.id.toString());
  assert.ok(
    Array.isArray(startData.questions),
    "Quiz harus memiliki daftar soal",
  );
  assert.ok(
    startData.questions.length > 0,
    "Quiz harus memiliki minimal satu soal",
  );
  startData.questions.forEach(assertQuestionPayload);

  const answers = startData.questions.map((question) => ({
    question_id: question.question_id,
    selected_option: DEFAULT_ANSWER,
    response_time: 1,
  }));

  const submit = await request(
    "POST",
    `/api/quiz/${startData.session_id}/submit`,
    accessToken,
    { answers, duration: answers.length },
  );
  expectStatus(submit, 200);

  console.log("\nQuiz API test berhasil.");
};

run().catch((error) => {
  console.error("\nQuiz API test gagal:", error.message);
  process.exitCode = 1;
});
