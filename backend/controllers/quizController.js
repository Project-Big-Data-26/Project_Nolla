const mongoose = require("mongoose");

const Bab = require("../models/Bab");
const Kelas = require("../models/Kelas");
const Jenjang = require("../models/Jenjang");
const Subbab = require("../models/Subbab");
const Pretest = require("../models/MengerjakanPretest");
const Soal = require("../models/Soal");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MendapatkanDifficulty = require("../models/MendapatkanDifficulty");
const MenyelesaikanSubbab = require("../models/MenyelesaikanSubbab");
const { toPublicImageUrls } = require("../utils/questionImage");
const {
  parseAnswerTiming,
  parseDurationSeconds,
  parseTimingMethod,
} = require("../utils/timing");
const {
  TransactionAbort,
  isDuplicateKeyError,
  withOptionalTransaction,
} = require("../utils/transaction");
const { MASTERY_RATING_THRESHOLD } = require("../utils/learningProgress");
const { getQuestionContentHash } = require("../utils/questionContent");
const {
  contextFromRequest,
  recordApplicationError,
  recordServerEvents,
  toId,
} = require("../services/analyticsService");

const DEFAULT_RATING = 1000;
const QUESTION_RATINGS = { easy: 600, medium: 1000, hard: 1400 };
const K_STUDENT = 24;
const K_QUESTION = 8;
// Naikkan versi bila aturan pemilihan soal atau rumus rating berubah.
const SELECTION_POLICY_VERSION = "rating_track_unused_shuffle_v1";
const SCORING_VERSION = "elo_k24_q8_sqrt_attempts_v1";

const LEVEL_THRESHOLDS = { hard: 1400, medium: 1000 };

const getDifficultyFromScore = (score) => {
  const numericScore = Number(score);

  if (numericScore >= LEVEL_THRESHOLDS.hard) return "hard";
  if (numericScore >= LEVEL_THRESHOLDS.medium) return "medium";
  return "easy";
};

const getLevelExpression = (field) => ({
  $switch: {
    branches: [
      { case: { $gte: [field, LEVEL_THRESHOLDS.hard] }, then: "hard" },
      { case: { $gte: [field, LEVEL_THRESHOLDS.medium] }, then: "medium" },
    ],
    default: "easy",
  },
});

const getQuestionDifficulty = (question) => {
  if (
    question.cognitive_score !== null &&
    question.cognitive_score !== undefined &&
    Number.isFinite(Number(question.cognitive_score))
  ) {
    return getDifficultyFromScore(question.cognitive_score);
  }

  return question.cognitive_level || "medium";
};

const getQuestionRating = (question) => {
  if (
    question.cognitive_score !== null &&
    question.cognitive_score !== undefined &&
    Number.isFinite(Number(question.cognitive_score))
  ) {
    return Number(question.cognitive_score);
  }

  return QUESTION_RATINGS[getQuestionDifficulty(question)];
};

const calculateExpectedScore = (studentRating, questionRating) =>
  1 / (1 + 10 ** ((questionRating - studentRating) / 400));

const shuffleQuestions = (questions) => {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const getUpdatedLevel = (score) => getDifficultyFromScore(score);

const serializeQuestion = (question, req) => ({
  question_id: question._id.toString(),
  subbab_id: question.subbab_id.toString(),
  question_text: question.soal_text,
  soal_type: question.soal_type,
  options: Array.isArray(question.options)
    ? question.options.map((option) => ({
        option_id: option.option_id,
        text: option.text,
      }))
    : [],
  image_url: toPublicImageUrls(question.image_url, req),
  cognitive_level: getQuestionDifficulty(question),
});

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const sendError = (res, statusCode, message) =>
  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
  });

const getUnlockedSubbab = async (userId, subbabId) => {
  const subbab = await Subbab.findById(subbabId).lean();
  if (!subbab) return null;

  const completedPretest = await Pretest.exists({
    user_id: userId,
    bab_id: subbab.bab_id,
    completed_at: { $ne: null },
  });

  return completedPretest ? subbab : null;
};

const getRequiredQuestionCount = async (subbab) => {
  const bab = await Bab.findById(subbab.bab_id).select("kelas_id").lean();
  if (!bab) return null;

  const kelas = await Kelas.findById(bab.kelas_id).select("jenjang_id").lean();
  if (!kelas) return null;

  const jenjang = await Jenjang.findById(kelas.jenjang_id)
    .select("name")
    .lean();

  return { SD: 10, SMP: 15, SMA: 20 }[jenjang?.name] ?? null;
};

const sendQuestionShortage = async (
  req,
  res,
  { subbabId, difficulty, requiredCount, availableCount },
) => {
  await recordServerEvents(contextFromRequest(req), [
    {
      name: "question_pool_insufficient",
      assessmentType: "quiz",
      properties: {
        subbab_id: toId(subbabId),
        track: difficulty ?? null,
        required_count: requiredCount,
        available_count: availableCount,
        policy_version: SELECTION_POLICY_VERSION,
      },
    },
  ]);

  return res.status(409).json({
    statusCode: 409,
    success: false,
    message: `Soal ${difficulty} habis atau belum mencukupi. Dibutuhkan ${requiredCount} soal, tersedia ${availableCount}.`,
    data: {
      subbab_id: subbabId,
      difficulty,
      required_questions: requiredCount,
      available_questions: availableCount,
      exhausted: true,
    },
  });
};

const getOrCreateDifficulty = async (userId, subbabId) =>
  MendapatkanDifficulty.findOneAndUpdate(
    { user_id: userId, subbab_id: subbabId },
    {
      $setOnInsert: {
        current_cognitive_level: getUpdatedLevel(DEFAULT_RATING),
        current_cognitive_score: DEFAULT_RATING,
        pretest_subbab_correct: 0,
        pretest_subbab_total: 0,
        updated_at: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const startQuiz = async (req, res) => {
  try {
    const { subbab_id: subbabId } = req.body;
    const userId = req.user.id;

    if (!isValidObjectId(subbabId)) {
      return sendError(res, 400, "subbab_id tidak valid");
    }

    const subbab = await getUnlockedSubbab(userId, subbabId);
    if (!subbab) {
      return sendError(res, 403, "Subbab belum tersedia untuk quiz");
    }

    const requiredQuestionCount = await getRequiredQuestionCount(subbab);
    if (!requiredQuestionCount) {
      return sendError(res, 500, "Jenjang subbab tidak dapat ditentukan");
    }

    const activeSession = await MengerjakanKuis.findOne({
      user_id: userId,
      subbab_id: subbabId,
      completed_at: null,
    })
      .sort({ sesi_ke: -1, started_at: -1 })
      .lean();

    if (activeSession) {
      const activeQuestionIds = activeSession.soal.map((item) => item.soal_id);

      if (activeQuestionIds.length !== requiredQuestionCount) {
        return sendQuestionShortage(req, res, {
          subbabId,
          difficulty: activeSession.cognitive_level,
          requiredCount: requiredQuestionCount,
          availableCount: activeQuestionIds.length,
        });
      }

      const activeQuestions = await Soal.find({
        _id: { $in: activeQuestionIds },
      }).lean();
      const activeQuestionMap = new Map(
        activeQuestions.map((question) => [question._id.toString(), question]),
      );

      if (activeQuestions.length !== activeQuestionIds.length) {
        return sendError(
          res,
          409,
          "Sebagian soal pada sesi quiz tidak lagi tersedia",
        );
      }

      const context = contextFromRequest(req);
      await recordServerEvents(context, [
        {
          name: "assessment_resumed",
          // Request ulang dalam sesi belajar yang sama bukan resume baru.
          businessKey: `assessment_resumed:${activeSession._id}:${context.learningSessionId ?? "no_session"}`,
          assessmentType: "quiz",
          attemptId: activeSession._id,
          properties: {
            subbab_id: toId(activeSession.subbab_id),
            sesi_ke: activeSession.sesi_ke,
            started_at: activeSession.started_at ?? null,
          },
        },
      ]);

      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Sesi quiz yang belum selesai dilanjutkan",
        data: {
          session_id: activeSession._id,
          subbab_id: activeSession.subbab_id,
          sesi_ke: activeSession.sesi_ke,
          cognitive_score: activeSession.cognitive_score,
          difficulty: activeSession.cognitive_level,
          started_at: activeSession.started_at,
          resumed: true,
          questions: activeQuestionIds.map((questionId) =>
            serializeQuestion(
              activeQuestionMap.get(questionId.toString()),
              req,
            ),
          ),
        },
      });
    }

    const difficulty = await getOrCreateDifficulty(userId, subbabId);
    const track = getDifficultyFromScore(difficulty.current_cognitive_score);
    const questionCandidates = await Soal.find({
      subbab_id: subbabId,
      status: { $ne: "inactive" },
    })
      .lean();

    const trackQuestions = questionCandidates.filter(
      (question) => getQuestionDifficulty(question) === track,
    );

    const previouslyUsedQuestionIds = new Set(
      (
        await MengerjakanKuis.distinct("soal.soal_id", {
          user_id: userId,
          subbab_id: subbabId,
        })
      ).map((questionId) => questionId.toString()),
    );
    const availableQuestions = trackQuestions.filter(
      (question) => !previouslyUsedQuestionIds.has(question._id.toString()),
    );

    if (availableQuestions.length < requiredQuestionCount) {
      // Start paralel lain mungkin baru membuat sesi (soalnya terhitung "terpakai"):
      // lanjutkan sesi itu, bukan melaporkan stok habis.
      if (
        !req.quizStartRetried &&
        (await MengerjakanKuis.exists({
          user_id: userId,
          subbab_id: subbabId,
          completed_at: null,
        }))
      ) {
        req.quizStartRetried = true;
        return startQuiz(req, res);
      }
      return sendQuestionShortage(req, res, {
        subbabId,
        difficulty: track,
        requiredCount: requiredQuestionCount,
        availableCount: availableQuestions.length,
      });
    }

    const questions = shuffleQuestions(availableQuestions).slice(
      0,
      requiredQuestionCount,
    );

    const latestSession = await MengerjakanKuis.findOne({
      user_id: userId,
      subbab_id: subbabId,
    })
      .sort({ sesi_ke: -1 })
      .select("sesi_ke")
      .lean();

    const session = await MengerjakanKuis.create({
      user_id: userId,
      subbab_id: subbabId,
      sesi_ke: (latestSession?.sesi_ke || 0) + 1,
      active_key: `${userId}:${subbabId}`,
      cognitive_level: track,
      cognitive_score: difficulty.current_cognitive_score,
      selection_policy_version: SELECTION_POLICY_VERSION,
      selection: {
        track,
        candidate_count: trackQuestions.length,
        available_count: availableQuestions.length,
      },
      soal: questions.map((question) => ({
        soal_id: question._id,
        rating_at_selection: getQuestionRating(question),
      })),
      started_at: new Date(),
    });

    await recordServerEvents(contextFromRequest(req), [
      {
        name: "assessment_started",
        businessKey: `assessment_started:quiz:${session._id}`,
        assessmentType: "quiz",
        attemptId: session._id,
        properties: {
          subbab_id: toId(subbabId),
          bab_id: toId(subbab.bab_id),
          sesi_ke: session.sesi_ke,
          rating_start: session.cognitive_score,
          planned_question_count: questions.length,
          track,
          candidate_count: trackQuestions.length,
          available_count: availableQuestions.length,
          policy_version: SELECTION_POLICY_VERSION,
        },
      },
      ...session.soal.map((item, index) => ({
        name: "question_assigned",
        businessKey: `question_assigned:${session._id}:${item.soal_id}`,
        assessmentType: "quiz",
        attemptId: session._id,
        itemId: `${session._id}:${index + 1}`,
        properties: {
          question_id: toId(item.soal_id),
          sequence: index + 1,
          rating_at_selection: item.rating_at_selection,
          student_rating: session.cognitive_score,
          selection_reason: "track_match_unused_random",
          policy_version: SELECTION_POLICY_VERSION,
        },
      })),
    ]);

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Quiz berhasil dimulai",
      data: {
        session_id: session._id,
        subbab_id: session.subbab_id,
        sesi_ke: session.sesi_ke,
        cognitive_score: session.cognitive_score,
        difficulty: track,
        started_at: session.started_at,
        resumed: false,
        questions: questions.map((question) =>
          serializeQuestion(question, req),
        ),
      },
    });
  } catch (error) {
    // Start paralel bentrok pada unique active_key/sesi_ke: ulangi sekali agar
    // request yang kalah melanjutkan sesi yang baru dibuat pemenang.
    if (isDuplicateKeyError(error) && !req.quizStartRetried) {
      req.quizStartRetried = true;
      return startQuiz(req, res);
    }
    console.error("Start quiz error:", error);
    await recordApplicationError(req, { operation: "quiz_start", statusCode: 500 });
    return sendError(res, 500, "Gagal memulai quiz");
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body ?? {};
    const userId = req.user.id;

    if (!isValidObjectId(sessionId)) {
      return sendError(res, 400, "sessionId tidak valid");
    }

    if (!Array.isArray(answers)) {
      return sendError(res, 400, "answers harus berupa array");
    }

    const duration = parseDurationSeconds(req.body.duration);
    if (duration.error) return sendError(res, 400, duration.error);

    const timingMethod = parseTimingMethod(req.body.timing_method);
    if (timingMethod.error) return sendError(res, 400, timingMethod.error);

    const answerMap = new Map();

    for (const answer of answers) {
      if (!isValidObjectId(answer?.question_id)) {
        return sendError(res, 400, "question_id tidak valid");
      }

      if (answerMap.has(answer.question_id.toString())) {
        return sendError(res, 400, "Question tidak boleh dijawab dua kali");
      }

      const selectedAnswer = answer.selected_option ?? answer.selected_answer;
      if (selectedAnswer === undefined || selectedAnswer === null) {
        return sendError(res, 400, "Jawaban untuk setiap question wajib diisi");
      }

      const timing = parseAnswerTiming(answer);
      if (timing.error) return sendError(res, 400, timing.error);

      answerMap.set(answer.question_id.toString(), {
        selectedAnswer,
        timing: timing.value,
      });
    }

    const { session, alreadySubmitted } = await withOptionalTransaction(
      (dbSession) =>
        finalizeQuizSubmission(
          {
            sessionId,
            userId,
            answerMap,
            duration: duration.value,
            timingMethod: timingMethod.value,
            context: contextFromRequest(req),
          },
          dbSession,
        ),
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: alreadySubmitted
        ? "Quiz sudah disubmit sebelumnya"
        : "Quiz berhasil disubmit",
      data: {
        session_id: session._id,
        subbab_id: session.subbab_id,
        sesi_ke: session.sesi_ke,
        correct_count: session.soal.filter((item) => item.is_correct).length,
        total_questions: session.soal.length,
        cognitive_score_before: session.cognitive_score,
        cognitive_score_after: session.cognitive_score_after ?? null,
        completed_at: session.completed_at,
        already_submitted: alreadySubmitted,
      },
    });
  } catch (error) {
    if (error instanceof TransactionAbort) {
      return sendError(res, error.statusCode, error.message);
    }
    console.error("Submit quiz error:", error);
    await recordApplicationError(req, { operation: "quiz_submit", statusCode: 500 });
    return sendError(res, 500, "Gagal mengirim hasil quiz");
  }
};

// Semua perhitungan selesai sebelum write pertama; write pertama adalah klaim
// atomik attempt sehingga submit ganda/paralel tidak menerapkan rating dua kali.
const finalizeQuizSubmission = async (
  { sessionId, userId, answerMap, duration, timingMethod, context },
  dbSession,
) => {
  const session = await MengerjakanKuis.findOne({
    _id: sessionId,
    user_id: userId,
  })
    .session(dbSession)
    .lean();

  if (!session) throw new TransactionAbort(404, "Session quiz tidak ditemukan");
  if (session.completed_at) return { session, alreadySubmitted: true };

  const selectedQuestionIds = new Set(
    session.soal.map((item) => item.soal_id.toString()),
  );
  for (const questionId of answerMap.keys()) {
    if (!selectedQuestionIds.has(questionId)) {
      throw new TransactionAbort(400, "Question bukan bagian dari session quiz");
    }
  }
  if (answerMap.size !== selectedQuestionIds.size) {
    throw new TransactionAbort(400, "Semua soal dalam session quiz wajib dijawab");
  }

  const hasDifficulty = await MendapatkanDifficulty.exists({
    user_id: userId,
    subbab_id: session.subbab_id,
  }).session(dbSession);
  if (!hasDifficulty) {
    throw new TransactionAbort(409, "Rating subbab tidak ditemukan");
  }

  const questions = await Soal.find({
    _id: { $in: session.soal.map((item) => item.soal_id) },
  })
    .session(dbSession)
    .lean();
  const questionById = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  let studentRating = Number(session.cognitive_score ?? DEFAULT_RATING);
  const answeredQuestions = [];
  const ratingDetails = [];
  const questionRatingOps = [];
  const now = new Date();

  for (const sessionQuestion of session.soal) {
    const questionId = sessionQuestion.soal_id.toString();
    const question = questionById.get(questionId);
    if (!question) {
      throw new TransactionAbort(409, "Question session sudah tidak tersedia");
    }

    const { selectedAnswer, timing } = answerMap.get(questionId);
    const isCorrect = String(selectedAnswer) === String(question.jawaban);
    const questionRating = getQuestionRating(question);
    const expectedScore = calculateExpectedScore(studentRating, questionRating);
    const actualScore = isCorrect ? 1 : 0;
    const previousAttempts = await MengerjakanKuis.countDocuments({
      "soal.soal_id": question._id,
      completed_at: { $ne: null },
    }).session(dbSession);
    const effectiveQuestionK = K_QUESTION / Math.sqrt(previousAttempts + 1);

    const studentRatingBefore = studentRating;
    studentRating += K_STUDENT * (actualScore - expectedScore);

    const questionRatingDelta =
      effectiveQuestionK * (expectedScore - actualScore);
    ratingDetails.push({ expectedScore, effectiveQuestionK });

    // Delta, bukan $set, agar submit siswa lain pada soal yang sama tidak tertimpa.
    questionRatingOps.push({
      updateOne: {
        filter: { _id: question._id },
        update: [
          {
            $set: {
              cognitive_score: {
                $add: [
                  { $ifNull: ["$cognitive_score", questionRating] },
                  questionRatingDelta,
                ],
              },
              updated_at: now,
            },
          },
          { $set: { cognitive_level: getLevelExpression("$cognitive_score") } },
        ],
      },
    });

    answeredQuestions.push({
      soal_id: question._id,
      pilihan_jawaban: String(selectedAnswer),
      is_correct: isCorrect,
      ...timing,
      rating_at_selection: sessionQuestion.rating_at_selection ?? null,
      question_rating_before: questionRating,
      question_rating_after: questionRating + questionRatingDelta,
      student_rating_before: studentRatingBefore,
      student_rating_after: studentRating,
      kunci_jawaban: String(question.jawaban),
      content_hash: getQuestionContentHash(question),
    });
  }

  const claimed = await MengerjakanKuis.findOneAndUpdate(
    { _id: session._id, completed_at: null },
    {
      $set: {
        soal: answeredQuestions,
        score: answeredQuestions.filter((item) => item.is_correct).length,
        duration,
        timing_method: timingMethod,
        cognitive_score_after: studentRating,
        scoring_version: SCORING_VERSION,
        rating_sync: dbSession ? "applied" : "pending",
        completed_at: now,
      },
      $unset: { active_key: "" },
    },
    { returnDocument: "after", session: dbSession, lean: true },
  );

  if (!claimed) {
    const current = await MengerjakanKuis.findById(session._id)
      .session(dbSession)
      .lean();
    if (!current?.completed_at) {
      throw new TransactionAbort(404, "Session quiz tidak ditemukan");
    }
    return { session: current, alreadySubmitted: true };
  }

  await Soal.collection.bulkWrite(questionRatingOps, {
    session: dbSession ?? undefined,
  });
  await MendapatkanDifficulty.updateOne(
    { user_id: userId, subbab_id: session.subbab_id },
    {
      $set: {
        current_cognitive_score: studentRating,
        current_cognitive_level: getUpdatedLevel(studentRating),
        updated_at: now,
      },
    },
    { session: dbSession },
  );
  await MenyelesaikanSubbab.updateOne(
    { user_id: userId, subbab_id: session.subbab_id },
    { $setOnInsert: { completed_at: now } },
    { upsert: true, session: dbSession },
  );

  await recordServerEvents(
    context,
    buildQuizSubmissionEvents(claimed, ratingDetails),
    dbSession,
  );

  if (!dbSession) {
    // Tanpa transaksi: "pending" yang tertinggal menandai efek rating belum lengkap.
    await MengerjakanKuis.updateOne(
      { _id: session._id },
      { $set: { rating_sync: "applied" } },
    );
    claimed.rating_sync = "applied";
  }

  return { session: claimed, alreadySubmitted: false };
};

const buildQuizSubmissionEvents = (attempt, ratingDetails) => {
  const attemptId = attempt._id.toString();
  const base = { assessmentType: "quiz", attemptId };
  const ratingBefore = Number(attempt.cognitive_score ?? DEFAULT_RATING);
  const ratingAfter = attempt.cognitive_score_after;
  const correctCount = attempt.soal.filter((item) => item.is_correct).length;
  const events = [];

  attempt.soal.forEach((item, index) => {
    const questionId = item.soal_id.toString();
    const itemId = `${attemptId}:${index + 1}`;

    events.push({
      ...base,
      name: "question_answer_recorded",
      businessKey: `question_answer_recorded:${attemptId}:${questionId}`,
      itemId,
      properties: {
        question_id: questionId,
        sequence: index + 1,
        selected_option: item.pilihan_jawaban,
        is_correct: item.is_correct,
        answered_at: attempt.completed_at,
        response_time_ms: item.response_time_ms ?? null,
        response_time_partial: item.response_time_partial ?? null,
        timing_source: attempt.timing_method ?? null,
        content_hash: item.content_hash,
      },
    });
    events.push({
      ...base,
      name: "rating_updated",
      businessKey: `rating_updated:${attemptId}:question:${questionId}`,
      itemId,
      properties: {
        target_type: "question",
        question_id: questionId,
        rating_before: item.question_rating_before,
        rating_after: item.question_rating_after,
        expected_score: ratingDetails[index].expectedScore,
        k_factor: ratingDetails[index].effectiveQuestionK,
        update_sequence: index + 1,
        scoring_version: attempt.scoring_version,
      },
    });
  });

  events.push({
    ...base,
    name: "rating_updated",
    businessKey: `rating_updated:${attemptId}:student`,
    properties: {
      target_type: "student_subbab",
      subbab_id: toId(attempt.subbab_id),
      rating_before: ratingBefore,
      rating_after: ratingAfter,
      k_factor: K_STUDENT,
      update_sequence: attempt.soal.length + 1,
      scoring_version: attempt.scoring_version,
    },
  });

  if (ratingBefore < MASTERY_RATING_THRESHOLD && ratingAfter >= MASTERY_RATING_THRESHOLD) {
    events.push({
      ...base,
      name: "subbab_mastery_reached",
      businessKey: `subbab_mastery_reached:${attemptId}`,
      properties: {
        subbab_id: toId(attempt.subbab_id),
        rating_before: ratingBefore,
        rating_after: ratingAfter,
        threshold: MASTERY_RATING_THRESHOLD,
      },
    });
  }

  events.push({
    ...base,
    name: "assessment_completed",
    businessKey: `assessment_completed:quiz:${attemptId}`,
    properties: {
      subbab_id: toId(attempt.subbab_id),
      sesi_ke: attempt.sesi_ke,
      correct_count: correctCount,
      question_count: attempt.soal.length,
      score_raw: correctCount,
      score_max: attempt.soal.length,
      rating_start: ratingBefore,
      rating_end: ratingAfter,
      wall_time_ms: attempt.started_at
        ? attempt.completed_at - new Date(attempt.started_at)
        : null,
      reported_duration_s: attempt.duration ?? null,
      timing_method: attempt.timing_method ?? null,
      scoring_version: attempt.scoring_version,
    },
  });

  return events;
};

const getQuizResult = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      return sendError(res, 400, "sessionId tidak valid");
    }

    const session = await MengerjakanKuis.findOne({
      _id: sessionId,
      user_id: req.user.id,
    }).lean();

    if (!session) return sendError(res, 404, "Session quiz tidak ditemukan");

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Hasil quiz berhasil diambil",
      data: {
        session_id: session._id,
        subbab_id: session.subbab_id,
        sesi_ke: session.sesi_ke,
        difficulty: session.cognitive_level,
        correct_count: session.soal.filter((item) => item.is_correct).length,
        total_questions: session.soal.length,
        score: session.score,
        duration: session.duration,
        started_at: session.started_at,
        completed_at: session.completed_at,
        cognitive_score: session.cognitive_score,
        cognitive_score_after: session.cognitive_score_after ?? null,
      },
    });
  } catch (error) {
    console.error("Get quiz result error:", error);
    return sendError(res, 500, "Gagal mengambil hasil quiz");
  }
};

const getQuizReview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      return sendError(res, 400, "sessionId tidak valid");
    }

    const session = await MengerjakanKuis.findOne({
      _id: sessionId,
      user_id: req.user.id,
    }).lean();

    if (!session) return sendError(res, 404, "Session quiz tidak ditemukan");
    if (!session.completed_at) {
      return sendError(res, 409, "Review tersedia setelah quiz diselesaikan");
    }

    const questions = await Soal.find({
      _id: { $in: session.soal.map((item) => item.soal_id) },
    }).lean();
    const questionById = new Map(
      questions.map((question) => [question._id.toString(), question]),
    );

    const reviewQuestions = session.soal.flatMap((answer, sequence) => {
      const question = questionById.get(answer.soal_id.toString());
      if (!question) return [];

      return [
        {
          question_id: question._id.toString(),
          sequence: sequence + 1,
          subbab_id: question.subbab_id.toString(),
          question_text: question.soal_text,
          soal_type: question.soal_type || null,
          options: Array.isArray(question.options)
            ? question.options.map((option) => ({
                option_id: option.option_id,
                text: option.text,
              }))
            : [],
          image_url: toPublicImageUrls(question.image_url, req),
          cognitive_level: getQuestionDifficulty(question),
          cognitive_score: getQuestionRating(question),
          rating_at_attempt: answer.question_rating_before ?? null,
          selected_answer: answer.pilihan_jawaban,
          // Kunci saat dinilai agar konsisten dengan is_correct walau soal diedit.
          correct_answer: answer.kunci_jawaban ?? question.jawaban,
          is_correct: Boolean(answer.is_correct),
          content_changed: answer.content_hash
            ? answer.content_hash !== getQuestionContentHash(question)
            : null,
          response_time: answer.response_time ?? null,
          response_time_ms: answer.response_time_ms ?? null,
          response_time_partial: answer.response_time_partial ?? null,
        },
      ];
    });

    const correctCount = reviewQuestions.filter(
      (item) => item.is_correct,
    ).length;

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Review quiz berhasil diambil",
      data: {
        session_id: session._id,
        subbab_id: session.subbab_id,
        sesi_ke: session.sesi_ke,
        difficulty: session.cognitive_level,
        cognitive_score_before: session.cognitive_score,
        cognitive_score_after: session.cognitive_score_after ?? null,
        correct_count: correctCount,
        wrong_count: Math.max(0, reviewQuestions.length - correctCount),
        total_questions: reviewQuestions.length,
        duration: session.duration,
        started_at: session.started_at,
        completed_at: session.completed_at,
        questions: reviewQuestions,
      },
    });
  } catch (error) {
    console.error("Get quiz review error:", error);
    return sendError(res, 500, "Gagal mengambil review quiz");
  }
};

module.exports = { startQuiz, submitQuiz, getQuizResult, getQuizReview };
