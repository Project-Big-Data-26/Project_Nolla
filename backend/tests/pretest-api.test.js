const assert = require("node:assert/strict");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const EMAIL = process.env.TEST_EMAIL || "student2@example.com";
const PASSWORD = process.env.TEST_PASSWORD || "12345678";

// Edit jawaban di sini. Urutan mengikuti soal yang dikirim API.
const ANSWERS = ["B", "B", "C", "B", "A"];
const EXPECTED_QUESTION_COUNT = 5;

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
  assert.ok(question, "Response harus memiliki question");
  assert.match(question.question_id, /^[a-f0-9]{24}$/i);
  assert.equal(typeof question.question_text, "string");
  assert.ok(
    question.question_text.length > 0,
    "question_text tidak boleh kosong",
  );
  assert.equal("id" in question, false, "Field id lama tidak boleh ada");
  assert.equal(
    "soal_text" in question,
    false,
    "Field soal_text API tidak boleh ada",
  );
  assert.ok(["prerequisite", "subbab"].includes(question.stage));
};

const run = async () => {
  assert.equal(
    ANSWERS.length,
    EXPECTED_QUESTION_COUNT,
    `Isi tepat ${EXPECTED_QUESTION_COUNT} jawaban pada ANSWERS`,
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

  const bab = babResponse.body?.data?.find(
    (item) => item.name?.toLowerCase() === "peluang" && item.total_subbab === 2,
  );
  assert.ok(bab, "Bab Peluang Kelas 12 dengan tepat 2 subbab tidak ditemukan");

  const babId = bab.id.toString();
  console.log(`\nBab target: ${bab.name} (${babId})`);

  const status = await request(
    "GET",
    `/api/pretest/status/${babId}`,
    accessToken,
  );
  expectStatus(status, 200);

  if (status.body?.data?.status === "completed") {
    throw new Error(
      "Pretest sudah selesai untuk user ini. Jalankan seed:fresh atau gunakan TEST_EMAIL user lain.",
    );
  }

  if (status.body?.data?.status === "active") {
    const discard = await request(
      "DELETE",
      `/api/pretest/${status.body.data.pretest_id}/discard`,
      accessToken,
    );
    expectStatus(discard, 200);
  }

  const start = await request("POST", "/api/pretest/start", accessToken, {
    bab_id: babId,
  });
  expectStatus(start, 201);

  const pretestId = start.body?.data?.pretest_id;
  let question = start.body?.data?.first_question;
  assert.ok(pretestId, "Start tidak mengembalikan pretest_id");
  assertQuestionPayload(question);

  const pendingReview = await request(
    "GET",
    `/api/pretest/${pretestId}/review`,
    accessToken,
  );
  expectStatus(pendingReview, 409);

  for (let index = 0; index < EXPECTED_QUESTION_COUNT; index += 1) {
    assert.equal(
      question.stage,
      index === 0 ? "prerequisite" : question.stage,
      "Stage soal tidak valid",
    );

    const answer = await request(
      "POST",
      `/api/pretest/${pretestId}/answer`,
      accessToken,
      {
        question_id: question.question_id,
        selected_answer: ANSWERS[index],
        response_time: 1,
      },
    );
    expectStatus(answer, 200);

    if (index < EXPECTED_QUESTION_COUNT - 1) {
      question = answer.body?.data?.next_question;
      assertQuestionPayload(question);
    } else {
      assert.equal(answer.body?.data?.next_question, null);
    }
  }

  const submit = await request(
    "POST",
    `/api/pretest/${pretestId}/submit`,
    accessToken,
  );
  expectStatus(submit, 200);
  assert.equal(submit.body?.data?.status, "completed");
  assert.equal(
    submit.body?.data?.difficulty?.length,
    2,
    "Submit harus mengembalikan difficulty untuk dua subbab target",
  );
  assert.ok(
    submit.body.data.difficulty.every(
      (item) =>
        ["easy", "medium", "hard"].includes(item.current_cognitive_level) &&
        typeof item.current_cognitive_score === "number",
    ),
    "Data difficulty submit harus memiliki level dan score",
  );

  const review = await request(
    "GET",
    `/api/pretest/${pretestId}/review`,
    accessToken,
  );
  expectStatus(review, 200);
  assert.equal(review.body?.data?.questions?.length, EXPECTED_QUESTION_COUNT);
  assert.ok(
    review.body.data.questions.every(
      (item) =>
        typeof item.selected_answer === "string" &&
        typeof item.correct_answer === "string" &&
        typeof item.is_correct === "boolean" &&
        item.options.some((option) => option.option_id === item.correct_answer),
    ),
    "Review harus menyertakan jawaban pengguna, kunci, dan status yang valid",
  );
  assert.ok(
    review.body.data.questions.every(
      (item) => item.is_correct === (item.selected_answer === item.correct_answer),
    ),
    "Status jawaban review harus konsisten dengan jawaban benar",
  );

  const result = await request(
    "GET",
    `/api/pretest/${pretestId}/result`,
    accessToken,
  );
  expectStatus(result, 200);
  assert.ok(
    Array.isArray(result.body?.data?.submateri_summary),
    "Result harus mengembalikan submateri_summary",
  );
  assert.equal(
    result.body.data.submateri_summary.length,
    2,
    "Result target Peluang harus memiliki tepat 2 subbab",
  );
  assert.ok(
    result.body.data.submateri_summary.every((item) => item.subbab_name),
    "Setiap hasil subbab harus memiliki subbab_name",
  );
  assert.ok(
    result.body.data.submateri_summary.every((item) => item.difficulty),
    "Setiap hasil subbab harus memiliki data difficulty",
  );
  const resultData = result.body.data;
  const targetSubbabNeedsHelp = resultData.submateri_summary.some(
    (item) => item.proficiency < 70,
  );
  const prerequisiteWasWrong = ANSWERS[0] !== "B";

  if (prerequisiteWasWrong) {
    assert.ok(
      resultData.recommendations.some(
        (item) => item.type === "prerequisite" && item.priority === "high",
      ),
      "Jawaban prasyarat yang salah harus menghasilkan recommendation prasyarat",
    );
  }

  if (targetSubbabNeedsHelp) {
    assert.ok(
      resultData.recommendations.some((item) => item.type === "subbab"),
      "Subbab dengan proficiency di bawah 70 harus memiliki recommendation",
    );
  }

  if (!prerequisiteWasWrong && !targetSubbabNeedsHelp) {
    assert.equal(
      resultData.recommendations[0].type,
      "positive",
      "Hasil sempurna harus memiliki recommendation positif",
    );
  }

  console.log("\nPretest API test berhasil.");
};

run().catch((error) => {
  console.error("\nPretest API test gagal:", error.message);
  process.exitCode = 1;
});
