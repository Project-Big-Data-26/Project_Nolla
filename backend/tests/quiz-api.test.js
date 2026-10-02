const assert = require("node:assert/strict");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const EMAIL = process.env.TEST_EMAIL || "student2@example.com";
const PASSWORD = process.env.TEST_PASSWORD || "12345678";
const BAB_NAME = (process.env.TEST_BAB_NAME || "Peluang").toLowerCase();
const SUBBAB_INDEX = Number(process.env.TEST_SUBBAB_INDEX || 0);
const QUIZ_REPEAT_COUNT = Number(process.env.QUIZ_REPEAT_COUNT || 1);
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

const assertDifficulty = (difficulty) => {
  assert.ok(
    ["easy", "medium", "hard"].includes(difficulty),
    `Difficulty tidak valid: ${difficulty}`,
  );
};

const assertQuestionPayload = (question) => {
  assert.ok(question, "Question tidak boleh kosong");
  assert.match(question.question_id, /^[a-f0-9]{24}$/i);
  assert.equal(typeof question.question_text, "string");
  assert.ok(question.question_text.length > 0);
  assert.ok(Array.isArray(question.options));
  assertDifficulty(question.cognitive_level);
  assert.equal("correct_answer" in question, false);
  assert.equal("jawaban_benar" in question, false);
};

const assertFixedDifficulty = (questions, expectedDifficulty) => {
  assert.ok(questions.length > 0, "Quiz harus memiliki minimal satu question");

  const questionIds = questions.map((question) => question.question_id);
  assert.equal(
    new Set(questionIds).size,
    questionIds.length,
    "Question tidak boleh duplikat dalam satu session",
  );

  questions.forEach((question) => {
    assertQuestionPayload(question);
    assert.equal(
      question.cognitive_level,
      expectedDifficulty,
      "Semua question dalam session harus memiliki difficulty yang sama",
    );
  });
};

const getDifficultyFromScore = (score) => {
  if (Number(score) >= 1400) return "hard";
  if (Number(score) >= 1000) return "medium";
  return "easy";
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
    Number.isInteger(QUIZ_REPEAT_COUNT) && QUIZ_REPEAT_COUNT > 0,
    "QUIZ_REPEAT_COUNT harus berupa bilangan bulat lebih besar dari 0",
  );
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
  console.log(`Jumlah pengulangan quiz: ${QUIZ_REPEAT_COUNT}`);

  let expectedSessionNumber = null;
  const previouslySeenQuestionIds = new Set();

  for (let repeat = 1; repeat <= QUIZ_REPEAT_COUNT; repeat += 1) {
    const start = await request("POST", "/api/quiz/start", accessToken, {
      subbab_id: subbab.id,
    });

    if (start.status === 409 && start.body?.data?.exhausted === true) {
      console.log(
        `Soal difficulty ${start.body.data.difficulty} sudah habis untuk subbab ini.`,
      );
      break;
    }

    expectStatus(start, 201);

    const startData = start.body?.data;
    assert.ok(
      startData?.session_id,
      "Start quiz tidak mengembalikan session_id",
    );
    assert.equal(startData.subbab_id.toString(), subbab.id.toString());
    assertDifficulty(startData.difficulty);
    assert.equal(
      getDifficultyFromScore(startData.cognitive_score),
      startData.difficulty,
      "Difficulty session harus berasal dari cognitive_score awal",
    );

    if (expectedSessionNumber === null) {
      expectedSessionNumber = startData.sesi_ke;
    } else {
      assert.equal(
        startData.sesi_ke,
        expectedSessionNumber + 1,
        "sesi_ke harus bertambah satu pada setiap pengulangan",
      );
      expectedSessionNumber = startData.sesi_ke;
    }

    assertFixedDifficulty(startData.questions, startData.difficulty);
    assert.equal(
      startData.questions.length,
      20,
      "Quiz jenjang SMA harus memiliki tepat 20 soal",
    );
    for (const question of startData.questions) {
      assert.equal(
        previouslySeenQuestionIds.has(question.question_id),
        false,
        "Question tidak boleh diberikan ulang pada attempt berikutnya",
      );
      previouslySeenQuestionIds.add(question.question_id);
    }

    const resumedStart = await request("POST", "/api/quiz/start", accessToken, {
      subbab_id: subbab.id,
    });
    expectStatus(resumedStart, 200);
    assert.equal(resumedStart.body?.data?.resumed, true);
    assert.equal(
      resumedStart.body?.data?.session_id.toString(),
      startData.session_id.toString(),
      "Start ulang harus melanjutkan session yang sama",
    );
    assert.deepEqual(
      resumedStart.body?.data?.questions.map(
        (question) => question.question_id,
      ),
      startData.questions.map((question) => question.question_id),
      "Resume harus mengembalikan kumpulan soal dan urutan yang sama",
    );

    const answers = startData.questions.map((question) => ({
      question_id: question.question_id,
      selected_option: DEFAULT_ANSWER,
      response_time: 1,
    }));

    const incompleteSubmit = await request(
      "POST",
      `/api/quiz/${startData.session_id}/submit`,
      accessToken,
      { answers: answers.slice(0, -1), duration: answers.length },
    );
    expectStatus(incompleteSubmit, 400);

    const pendingReview = await request(
      "GET",
      `/api/quiz/${startData.session_id}/review`,
      accessToken,
    );
    expectStatus(pendingReview, 409);

    const submit = await request(
      "POST",
      `/api/quiz/${startData.session_id}/submit`,
      accessToken,
      { answers, duration: answers.length },
    );
    expectStatus(submit, 200);

    const submitData = submit.body?.data;
    assert.equal(
      submitData.session_id.toString(),
      startData.session_id.toString(),
    );
    assert.equal(submitData.total_questions, answers.length);
    assert.equal(typeof submitData.correct_count, "number");
    assert.equal(typeof submitData.cognitive_score_before, "number");
    assert.equal(typeof submitData.cognitive_score_after, "number");
    assert.ok(
      submitData.completed_at,
      "Quiz harus memiliki completed_at setelah submit",
    );

    const review = await request(
      "GET",
      `/api/quiz/${startData.session_id}/review`,
      accessToken,
    );
    expectStatus(review, 200);
    assert.equal(review.body?.data?.questions?.length, answers.length);
    assert.ok(
      review.body.data.questions.every(
        (item) =>
          typeof item.selected_answer === "string" &&
          typeof item.correct_answer === "string" &&
          typeof item.is_correct === "boolean" &&
          item.options.some((option) => option.option_id === item.correct_answer),
      ),
      "Quiz review harus mengembalikan jawaban pengguna dan kunci jawaban",
    );

    const updatedBabResponse = await request(
      "GET",
      "/api/dashboard/bab?kelas=12",
      accessToken,
    );
    expectStatus(updatedBabResponse, 200);
    const updatedTargetSubbab = getTargetSubbab(updatedBabResponse.body).subbab;
    assert.equal(
      updatedTargetSubbab.completed,
      true,
      "Subbab harus ditandai selesai setelah quiz disubmit",
    );

    const result = await request(
      "GET",
      `/api/quiz/${startData.session_id}/result`,
      accessToken,
    );
    expectStatus(result, 200);
    assert.equal(
      result.body?.data?.session_id.toString(),
      startData.session_id.toString(),
    );
    assert.equal(result.body?.data?.total_questions, answers.length);
    assert.ok(result.body?.data?.completed_at);

    console.log(
      `Quiz pengulangan ${repeat}/${QUIZ_REPEAT_COUNT} berhasil: ${startData.difficulty}`,
    );
  }

  console.log("\nQuiz API test berhasil.");
};

run().catch((error) => {
  console.error("\nQuiz API test gagal:", error.message);
  process.exitCode = 1;
});
