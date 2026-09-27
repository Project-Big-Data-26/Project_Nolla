const mongoose = require("mongoose");

const Subbab = require("../models/Subbab");
const Pretest = require("../models/MengerjakanPretest");
const Soal = require("../models/Soal");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MendapatkanDifficulty = require("../models/MendapatkanDifficulty");
const MenyelesaikanSubbab = require("../models/MenyelesaikanSubbab");

const DEFAULT_RATING = 1000;
const QUESTION_RATINGS = { easy: 600, medium: 1000, hard: 1400 };
const K_STUDENT = 24;
const K_QUESTION = 8;

const getDifficultyFromScore = (score) => {
  const numericScore = Number(score);

  if (numericScore >= 1400) return "hard";
  if (numericScore >= 1000) return "medium";
  return "easy";
};

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

const getUpdatedLevel = (score) => getDifficultyFromScore(score);

const serializeQuestion = (question) => ({
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
  image_url: Array.isArray(question.image_url) ? question.image_url : [],
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

    const activeSession = await MengerjakanKuis.findOne({
      user_id: userId,
      subbab_id: subbabId,
      completed_at: null,
    })
      .sort({ sesi_ke: -1, started_at: -1 })
      .lean();

    if (activeSession) {
      const activeQuestionIds = activeSession.soal.map((item) => item.soal_id);
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
            serializeQuestion(activeQuestionMap.get(questionId.toString())),
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
      .sort({ created_at: 1, _id: 1 })
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

    if (!trackQuestions.length) {
      if (previouslyUsedQuestionIds.size > 0) {
        return res.status(409).json({
          statusCode: 409,
          success: false,
          message: `Soal untuk level ${track} pada subbab ini sudah habis`,
          data: {
            subbab_id: subbabId,
            difficulty: track,
            exhausted: true,
          },
        });
      }

      return sendError(
        res,
        409,
        `Bank soal ${track} untuk subbab ini belum mencukupi`,
      );
    }

    const questions = trackQuestions.filter(
      (question) => !previouslyUsedQuestionIds.has(question._id.toString()),
    );

    if (!questions.length) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: `Soal untuk level ${track} pada subbab ini sudah habis`,
        data: {
          subbab_id: subbabId,
          difficulty: track,
          exhausted: true,
        },
      });
    }

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
      cognitive_level: track,
      cognitive_score: difficulty.current_cognitive_score,
      soal: questions.map((question) => ({ soal_id: question._id })),
      started_at: new Date(),
    });

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
        questions: questions.map(serializeQuestion),
      },
    });
  } catch (error) {
    console.error("Start quiz error:", error);
    return sendError(res, 500, "Gagal memulai quiz");
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers, duration } = req.body;
    const userId = req.user.id;

    if (!isValidObjectId(sessionId)) {
      return sendError(res, 400, "sessionId tidak valid");
    }

    if (!Array.isArray(answers)) {
      return sendError(res, 400, "answers harus berupa array");
    }

    const session = await MengerjakanKuis.findOne({
      _id: sessionId,
      user_id: userId,
    });

    if (!session) return sendError(res, 404, "Session quiz tidak ditemukan");
    if (session.completed_at) {
      return sendError(res, 409, "Session quiz sudah disubmit");
    }

    const selectedQuestionIds = session.soal.map((item) =>
      item.soal_id.toString(),
    );
    const answerMap = new Map();

    for (const answer of answers) {
      if (!isValidObjectId(answer.question_id)) {
        return sendError(res, 400, "question_id tidak valid");
      }

      if (!selectedQuestionIds.includes(answer.question_id.toString())) {
        return sendError(res, 400, "Question bukan bagian dari session quiz");
      }

      if (answerMap.has(answer.question_id.toString())) {
        return sendError(res, 400, "Question tidak boleh dijawab dua kali");
      }

      answerMap.set(answer.question_id.toString(), answer);
    }

    const questions = await Soal.find({
      _id: { $in: session.soal.map((item) => item.soal_id) },
    }).lean();
    const questionById = new Map(
      questions.map((question) => [question._id.toString(), question]),
    );

    let studentRating = Number(session.cognitive_score ?? DEFAULT_RATING);
    let correctCount = 0;
    const answeredQuestions = [];

    for (const sessionQuestion of session.soal) {
      const questionId = sessionQuestion.soal_id.toString();
      const question = questionById.get(questionId);
      if (!question)
        return sendError(res, 409, "Question session sudah tidak tersedia");

      const answer = answerMap.get(questionId);
      const selectedAnswer =
        answer?.selected_option ?? answer?.selected_answer ?? null;
      const isCorrect =
        selectedAnswer !== null &&
        String(selectedAnswer) === String(question.correct_answer);
      const questionRating = getQuestionRating(question);
      const expectedScore = calculateExpectedScore(
        studentRating,
        questionRating,
      );
      const actualScore = isCorrect ? 1 : 0;
      const previousAttempts = await MengerjakanKuis.countDocuments({
        "soal.soal_id": question._id,
        completed_at: { $ne: null },
      });
      const effectiveQuestionK = K_QUESTION / Math.sqrt(previousAttempts + 1);

      studentRating += K_STUDENT * (actualScore - expectedScore);

      const updatedQuestionRating =
        questionRating + effectiveQuestionK * (actualScore - expectedScore);
      await Soal.updateOne(
        { _id: question._id },
        {
          $set: {
            cognitive_score: updatedQuestionRating,
            cognitive_level: getUpdatedLevel(updatedQuestionRating),
            updated_at: new Date(),
          },
        },
      );

      if (isCorrect) correctCount += 1;
      answeredQuestions.push({
        soal_id: question._id,
        pilihan_jawaban: selectedAnswer,
        is_correct: isCorrect,
        response_time: answer?.response_time ?? null,
      });
    }

    const completedAt = new Date();
    const updatedDifficulty = await MendapatkanDifficulty.findOneAndUpdate(
      { user_id: userId, subbab_id: session.subbab_id },
      {
        $set: {
          current_cognitive_score: studentRating,
          current_cognitive_level: getUpdatedLevel(studentRating),
          updated_at: completedAt,
        },
      },
      { new: true },
    );

    if (!updatedDifficulty) {
      return sendError(res, 409, "Rating subbab tidak ditemukan");
    }

    session.soal = answeredQuestions;
    session.score = correctCount;
    session.duration = duration ?? null;
    session.completed_at = completedAt;
    await session.save();

    await MenyelesaikanSubbab.updateOne(
      { user_id: userId, subbab_id: session.subbab_id },
      { $setOnInsert: { completed_at: completedAt } },
      { upsert: true },
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Quiz berhasil disubmit",
      data: {
        session_id: session._id,
        subbab_id: session.subbab_id,
        sesi_ke: session.sesi_ke,
        correct_count: correctCount,
        total_questions: session.soal.length,
        cognitive_score_before: session.cognitive_score,
        cognitive_score_after: updatedDifficulty.current_cognitive_score,
        completed_at: session.completed_at,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return sendError(res, 500, "Gagal mengirim hasil quiz");
  }
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
      },
    });
  } catch (error) {
    console.error("Get quiz result error:", error);
    return sendError(res, 500, "Gagal mengambil hasil quiz");
  }
};

module.exports = { startQuiz, submitQuiz, getQuizResult };
