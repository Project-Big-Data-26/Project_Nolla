const mongoose = require("mongoose");

const Bab = require("../models/Bab");
const Subbab = require("../models/Subbab");
const Pertanyaan = require("../models/Soal");
const Pretest = require("../models/MengerjakanPretest");
const PertanyaanPretest = require("../models/MenjawabSoalPretest");
const UserProficiency = require("../models/MendapatkanDifficulty");
const BabPrasyarat = require("../models/MemilikiPrasyarat");

const serializeQuestion = (question) => {
  if (!question) return null;

  const normalizedOptions = Array.isArray(question.options)
    ? question.options.map((option) => ({
        option_id: option.option_id,
        text: option.text,
      }))
    : [];

  return {
    question_id: question._id ? question._id.toString() : null,
    subbab_id: question.subbab_id ? question.subbab_id.toString() : null,
    question_text: question.soal_text ?? "",
    soal_type: question.soal_type || null,
    options: normalizedOptions,
    option_texts: normalizedOptions.map((option) => option.text),
    image_url: Array.isArray(question.image_url) ? question.image_url : [],
    cognitive_score: question.cognitive_score ?? null,
  };
};

const decimalToNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value.toString === "function") return Number(value.toString());
  return Number(value);
};

const getQuestionSetForBab = async (babId) => {
  const subbabList = await Subbab.find({ bab_id: babId })
    .select("_id bab_id")
    .lean();

  const subbabIds = subbabList.map((subbab) => subbab._id);

  const questions = await Pertanyaan.find({
    subbab_id: { $in: subbabIds },
  })
    .sort({ subbab_id: 1, created_at: 1, _id: 1 })
    .lean();

  return { subbabIds, questions };
};

const getDifficultyFromScore = (cognitiveScore) => {
  const score = Number(cognitiveScore ?? 0);

  if (Number.isNaN(score)) return "easy";
  if (score >= 1400) return "hard";
  if (score >= 1000) return "medium";
  return "easy";
};

const getDifficultyBand = (question) =>
  getDifficultyFromScore(question?.cognitive_score ?? 0);

const getSubbabDifficultyFromPerformance = (correct, total) => {
  const correctCount = Number(correct ?? 0);
  const totalCount = Number(total ?? 0);

  if (!totalCount || correctCount <= 0) {
    return { difficulty: "easy", score: 600 };
  }

  if (correctCount === 1) {
    return { difficulty: "medium", score: 1000 };
  }

  return { difficulty: "hard", score: 1400 };
};

const getDifficultyFromPerformance = (correct, total) =>
  getSubbabDifficultyFromPerformance(correct, total).difficulty;

const getDifficultyScore = (difficulty) =>
  ({ easy: 600, medium: 1000, hard: 1400 })[difficulty] ?? 600;

const pickDeterministicQuestion = (questions) => {
  if (!Array.isArray(questions) || !questions.length) return null;

  return [...questions].sort((left, right) => {
    const leftCreated = left?.created_at
      ? new Date(left.created_at).getTime()
      : 0;
    const rightCreated = right?.created_at
      ? new Date(right.created_at).getTime()
      : 0;

    return (
      leftCreated - rightCreated ||
      left._id.toString().localeCompare(right._id.toString())
    );
  })[0];
};

const pickRandomQuestion = (questions) => {
  if (!Array.isArray(questions) || !questions.length) return null;

  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

const getPrerequisiteQuestionPool = async (babId) => {
  const prerequisiteRelations = await BabPrasyarat.find({ bab_id: babId })
    .select("relasi_bab_id")
    .sort({ relasi_bab_id: 1 })
    .lean();

  const prerequisiteQuestions = [];

  for (const relation of prerequisiteRelations) {
    const lastSubbab = await Subbab.findOne({
      bab_id: relation.relasi_bab_id,
    })
      .select("_id display_order")
      .sort({ display_order: -1, _id: 1 })
      .lean();

    if (!lastSubbab) continue;

    const question = await Pertanyaan.findOne({
      subbab_id: lastSubbab._id,
      cognitive_score: { $gte: 1200 },
    })
      .sort({ cognitive_score: -1, created_at: 1, _id: 1 })
      .lean();

    if (question) prerequisiteQuestions.push(question);
  }

  return prerequisiteQuestions;
};

const getExpectedQuestionBudget = async (babId) => {
  const prerequisiteQuestions = await getPrerequisiteQuestionPool(babId);
  const prerequisiteQuestionLimit = prerequisiteQuestions.length;
  const subbabList = await Subbab.find({ bab_id: babId }).select("_id").lean();

  return {
    prerequisiteQuestionLimit,
    subbabCount: subbabList.length,
    totalQuestions: prerequisiteQuestionLimit + subbabList.length * 2,
  };
};

const getPretestQuestionPool = async (babId) => {
  const { questions: babQuestions } = await getQuestionSetForBab(babId);
  const prerequisiteQuestions = await getPrerequisiteQuestionPool(babId);
  const expectedBudget = await getExpectedQuestionBudget(babId);

  return {
    babQuestions,
    prerequisiteQuestions,
    questions: [...prerequisiteQuestions, ...babQuestions],
    totalQuestions: expectedBudget.totalQuestions,
  };
};

const selectQuestionByDifficulty = (questions, difficulty) => {
  if (!Array.isArray(questions) || !questions.length) return [];

  const matching = questions.filter(
    (question) => getDifficultyBand(question) === difficulty,
  );

  return matching;
};

const getPretestQuestionState = async (pretest) => {
  const {
    babQuestions,
    questions: allQuestions,
    prerequisiteQuestions,
    totalQuestions: expectedTotalQuestions,
  } = await getPretestQuestionPool(pretest.bab_id.toString());

  const answeredRecords = await PertanyaanPretest.find({
    pretest_id: pretest._id,
  })
    .populate("soal_id")
    .lean();

  const answeredIds = new Set(
    answeredRecords
      .map((record) => record.soal_id?._id?.toString())
      .filter(Boolean),
  );

  const hasPrerequisiteRelation = prerequisiteQuestions.length > 0;
  const prerequisiteQuestionLimit = prerequisiteQuestions.length;
  const remainingPrerequisiteQuestions = prerequisiteQuestions.filter(
    (question) => !answeredIds.has(question._id.toString()),
  );

  if (
    hasPrerequisiteRelation &&
    answeredRecords.length < prerequisiteQuestionLimit &&
    remainingPrerequisiteQuestions.length
  ) {
    const nextQuestion = pickDeterministicQuestion(
      selectQuestionByDifficulty(remainingPrerequisiteQuestions, "hard"),
    );

    return {
      totalQuestions: expectedTotalQuestions,
      answeredQuestions: answeredRecords.length,
      correctAnswers: answeredRecords.filter((record) => record.is_correct)
        .length,
      remainingQuestions: allQuestions.filter(
        (question) => !answeredIds.has(question._id.toString()),
      ),
      nextQuestion,
      nextQuestionSequence: answeredRecords.length + 1,
      answeredIds,
      stage: "prerequisite",
    };
  }

  const subbabProgress = new Map();
  for (const record of answeredRecords) {
    const question = record.soal_id;
    if (!question || !question.subbab_id) continue;

    const subbabId = question.subbab_id.toString();
    const progress = subbabProgress.get(subbabId) || {
      answeredCount: 0,
      lastCorrect: null,
    };

    progress.answeredCount += 1;
    progress.lastCorrect = Boolean(record.is_correct);
    subbabProgress.set(subbabId, progress);
  }

  const subbabOrder = [
    ...new Set(
      babQuestions
        .filter((question) => question.subbab_id)
        .map((question) => question.subbab_id.toString()),
    ),
  ];

  for (const subbabId of subbabOrder) {
    const questionsInSubbab = babQuestions.filter(
      (question) =>
        question.subbab_id &&
        question.subbab_id.toString() === subbabId &&
        !answeredIds.has(question._id.toString()),
    );

    if (!questionsInSubbab.length) continue;

    const progress = subbabProgress.get(subbabId) || {
      answeredCount: 0,
      lastCorrect: null,
    };

    if (progress.answeredCount >= 2) continue;

    const targetDifficulty =
      progress.answeredCount === 0
        ? "medium"
        : progress.lastCorrect
          ? "hard"
          : "easy";

    const nextQuestion = pickRandomQuestion(
      selectQuestionByDifficulty(questionsInSubbab, targetDifficulty),
    );

    if (nextQuestion) {
      return {
        totalQuestions: expectedTotalQuestions,
        answeredQuestions: answeredRecords.length,
        correctAnswers: answeredRecords.filter((record) => record.is_correct)
          .length,
        remainingQuestions: allQuestions.filter(
          (question) => !answeredIds.has(question._id.toString()),
        ),
        nextQuestion,
        nextQuestionSequence: answeredRecords.length + 1,
        answeredIds,
        stage: "subbab",
      };
    }
  }

  return {
    totalQuestions: expectedTotalQuestions,
    answeredQuestions: answeredRecords.length,
    correctAnswers: answeredRecords.filter((record) => record.is_correct)
      .length,
    remainingQuestions: allQuestions.filter(
      (question) => !answeredIds.has(question._id.toString()),
    ),
    nextQuestion: null,
    nextQuestionSequence: answeredRecords.length + 1,
    answeredIds,
    stage: null,
  };
};

const buildBabSummary = (records, babId) => {
  const total = records.length;
  const correct = records.filter((record) => record.is_correct).length;
  const proficiency = total ? Math.round((correct / total) * 100) : 0;

  return {
    bab_id: babId,
    total_questions: total,
    correct_answers: correct,
    proficiency,
    status:
      proficiency >= 70
        ? "unlocked"
        : proficiency >= 40
          ? "warning"
          : "soft_locked",
  };
};

const getPretestBabBreakdown = async (pretestBabId, answerRecords) => {
  if (!answerRecords.length) {
    return {
      current_bab: buildBabSummary([], pretestBabId),
      prerequisite_babs: [],
      prerequisite_proficiency: null,
    };
  }

  const questionIds = answerRecords
    .map((record) => record.soal_id?._id)
    .filter(Boolean);

  const questionRecords = await Pertanyaan.find({
    _id: { $in: questionIds },
  })
    .select("_id subbab_id")
    .lean();

  const questionMap = new Map(
    questionRecords.map((question) => [question._id.toString(), question]),
  );

  const subbabIds = [
    ...new Set(
      questionRecords
        .filter((question) => question.subbab_id)
        .map((question) => question.subbab_id.toString()),
    ),
  ];

  const subbabRecords = await Subbab.find({
    _id: { $in: subbabIds },
  })
    .select("_id bab_id")
    .lean();

  const subbabBabMap = new Map(
    subbabRecords.map((subbab) => [subbab._id.toString(), subbab.bab_id]),
  );

  const prerequisiteRelations = await BabPrasyarat.find({
    bab_id: pretestBabId,
  })
    .select("relasi_bab_id")
    .lean();

  const prerequisiteBabIds = new Set(
    prerequisiteRelations
      .map((relation) => relation.relasi_bab_id?.toString())
      .filter(Boolean),
  );

  const currentBabRecords = [];
  const prerequisiteBabRecords = new Map();

  for (const record of answerRecords) {
    const question = questionMap.get(record.soal_id._id.toString());
    if (!question || !question.subbab_id) continue;

    const subbabBabId = subbabBabMap.get(question.subbab_id.toString());
    const questionBabId = subbabBabId
      ? subbabBabId.toString()
      : pretestBabId.toString();

    if (questionBabId === pretestBabId.toString()) {
      currentBabRecords.push(record);
      continue;
    }

    if (prerequisiteBabIds.has(questionBabId)) {
      const babBucket = prerequisiteBabRecords.get(questionBabId) || [];
      babBucket.push(record);
      prerequisiteBabRecords.set(questionBabId, babBucket);
    }
  }

  const currentBabSummary = buildBabSummary(
    currentBabRecords,
    pretestBabId.toString(),
  );
  const prerequisiteBabSummary = [...prerequisiteBabRecords.entries()].map(
    ([babId, records]) => buildBabSummary(records, babId),
  );

  const prerequisiteProficiency = prerequisiteBabSummary.length
    ? Math.round(
        prerequisiteBabSummary.reduce(
          (sum, item) => sum + item.proficiency,
          0,
        ) / prerequisiteBabSummary.length,
      )
    : null;

  return {
    current_bab: currentBabSummary,
    prerequisite_babs: prerequisiteBabSummary,
    prerequisite_proficiency: prerequisiteProficiency,
  };
};

const computeQuestionRating = (cognitiveScore) => {
  if (typeof cognitiveScore !== "number" || Number.isNaN(cognitiveScore)) {
    return 1000;
  }

  if (cognitiveScore < 800) return 800;
  if (cognitiveScore < 1200) return 1000;
  return 1200;
};

const getEloAdjustedRating = ({ currentRating, questionRating, isCorrect }) => {
  const expectedScore =
    1 / (1 + 10 ** ((questionRating - currentRating) / 400));
  const score = isCorrect ? 1 : 0;
  const k = 24;

  return currentRating + k * (score - expectedScore);
};

const getPretestStatus = async (req, res) => {
  try {
    const { babId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(babId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "babId tidak valid.",
      });
    }

    const bab = await Bab.findById(babId).select("_id name").lean();

    if (!bab) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Bab tidak ditemukan.",
      });
    }

    const pretest = await Pretest.findOne({
      user_id: req.user.id,
      bab_id: babId,
    })
      .select("_id bab_id started_at completed_at score")
      .lean();

    if (!pretest) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Pretest belum pernah dibuat untuk bab ini.",
        data: {
          bab_id: babId,
          has_pretest: false,
          status: "not_started",
        },
      });
    }

    const status = pretest.completed_at ? "completed" : "active";

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Status pretest berhasil diambil.",
      data: {
        bab_id: babId,
        has_pretest: true,
        status,
        pretest_id: pretest._id,
      },
    });
  } catch (error) {
    console.error("Get pretest status error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat mengambil status pretest.",
      error: error.message,
    });
  }
};

const startPretest = async (req, res) => {
  try {
    const { bab_id } = req.body;

    if (!bab_id || !mongoose.Types.ObjectId.isValid(bab_id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "bab_id wajib diisi dengan format ObjectId yang valid.",
      });
    }

    const bab = await Bab.findById(bab_id).lean();

    if (!bab) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Bab tidak ditemukan.",
      });
    }

    const existingPretest = await Pretest.findOne({
      user_id: req.user.id,
      bab_id: bab_id,
    }).lean();

    if (existingPretest) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: existingPretest.completed_at
          ? "Pretest untuk bab ini sudah selesai dan tidak dapat diulang."
          : "Sesi pretest untuk bab ini masih berlangsung (in_progress).",
        data: {
          pretest_id: existingPretest._id,
          bab_id: bab_id,
          status: existingPretest.completed_at ? "completed" : "in_progress",
        },
      });
    }

    const {
      questions: pretestQuestionPool,
      totalQuestions: expectedTotalQuestions,
    } = await getPretestQuestionPool(bab_id);

    if (!pretestQuestionPool.length) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message:
          "Bab ini belum memiliki soal yang dapat digunakan sebagai pretest.",
      });
    }

    const pretest = await Pretest.create({
      user_id: req.user.id,
      bab_id: bab_id,
      score: null,
      duration: null,
      started_at: new Date(),
      completed_at: null,
      current_question_id: null,
    });

    const questionState = await getPretestQuestionState(pretest);
    const firstQuestion = questionState.nextQuestion
      ? serializeQuestion(questionState.nextQuestion)
      : null;

    if (firstQuestion?.question_id) {
      pretest.current_question_id = new mongoose.Types.ObjectId(
        firstQuestion.question_id,
      );
      await pretest.save();
    }

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Pretest berhasil dimulai.",
      data: {
        pretest_id: pretest._id,
        bab_id: bab_id,
        started_at: pretest.started_at,
        status: "active",
        total_questions: expectedTotalQuestions,
        stage: questionState.stage || "prerequisite",
        first_question: firstQuestion
          ? {
              ...firstQuestion,
              stage: questionState.stage || "prerequisite",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Start pretest error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat memulai pretest.",
      error: error.message,
    });
  }
};

const getNextQuestion = async (req, res) => {
  try {
    const { pretestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pretestId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "pretestId tidak valid.",
      });
    }

    const pretest = await Pretest.findById(pretestId).lean();

    if (!pretest) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pretest tidak ditemukan.",
      });
    }

    if (pretest.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Anda tidak memiliki akses ke pretest ini.",
      });
    }

    if (pretest.completed_at) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Pretest sudah selesai dan tidak bisa dilanjutkan.",
      });
    }

    const answeredRecords = await PertanyaanPretest.find({
      pretest_id: pretestId,
    })
      .select("soal_id")
      .lean();
    const answeredIds = new Set(
      answeredRecords
        .map((record) => record.soal_id?.toString())
        .filter(Boolean),
    );

    let activeQuestion = null;
    if (pretest.current_question_id) {
      const lockedQuestion = await Pertanyaan.findById(
        pretest.current_question_id,
      ).lean();

      if (lockedQuestion && !answeredIds.has(lockedQuestion._id.toString())) {
        activeQuestion = lockedQuestion;
      }
    }

    const {
      totalQuestions,
      remainingQuestions,
      nextQuestionSequence,
      stage,
      nextQuestion,
    } = await getPretestQuestionState(pretest);

    const finalNextQuestion = activeQuestion || nextQuestion;

    if (!remainingQuestions.length || !finalNextQuestion) {
      await Pretest.findByIdAndUpdate(pretestId, { current_question_id: null });
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Semua soal sudah dijawab.",
        data: {
          pretest_id: pretest._id,
          bab_id: pretest.bab_id,
          total_questions: totalQuestions,
          sequence: totalQuestions,
          next_question: null,
        },
      });
    }

    if (
      finalNextQuestion._id.toString() !==
      (pretest.current_question_id || "").toString()
    ) {
      await Pretest.findByIdAndUpdate(pretestId, {
        current_question_id: finalNextQuestion._id,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Soal pretest berhasil diambil.",
      data: {
        pretest_id: pretest._id,
        bab_id: pretest.bab_id,
        question: {
          ...serializeQuestion(finalNextQuestion),
          stage: stage || "subbab",
        },
        sequence: nextQuestionSequence,
        total_questions: totalQuestions,
        stage: stage || "subbab",
      },
    });
  } catch (error) {
    console.error("Get next question error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat mengambil soal pretest.",
      error: error.message,
    });
  }
};

const answerPretestQuestion = async (req, res) => {
  try {
    const { pretestId } = req.params;
    const { question_id, selected_answer, response_time } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pretestId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "pretestId tidak valid.",
      });
    }

    if (!question_id || !mongoose.Types.ObjectId.isValid(question_id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "question_id wajib diisi dengan format ObjectId yang valid.",
      });
    }

    if (selected_answer === undefined || selected_answer === null) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "selected_answer wajib diisi.",
      });
    }

    const pretest = await Pretest.findById(pretestId).lean();

    if (!pretest) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pretest tidak ditemukan.",
      });
    }

    if (pretest.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Anda tidak memiliki akses ke pretest ini.",
      });
    }

    if (pretest.completed_at) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Pretest sudah selesai, jawaban tidak dapat ditambahkan lagi.",
      });
    }

    const question = await Pertanyaan.findById(question_id).lean();

    if (!question) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Soal tidak ditemukan.",
      });
    }

    const { questions: allPretestQuestions } = await getPretestQuestionPool(
      pretest.bab_id.toString(),
    );
    const validSubbabIds = new Set(
      allPretestQuestions
        .map((item) => item.subbab_id?.toString())
        .filter(Boolean),
    );
    const questionSubbabId = question.subbab_id
      ? question.subbab_id.toString()
      : null;

    if (!questionSubbabId || !validSubbabIds.has(questionSubbabId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Soal tersebut tidak termasuk dalam pool pretest yang valid.",
      });
    }

    const existingAnswer = await PertanyaanPretest.findOne({
      pretest_id: pretestId,
      soal_id: question_id,
    }).lean();

    if (existingAnswer) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Soal tersebut sudah pernah dijawab pada sesi pretest ini.",
      });
    }

    const currentQuestionId = pretest.current_question_id
      ? pretest.current_question_id.toString()
      : null;

    if (currentQuestionId && currentQuestionId !== question_id) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message:
          "Soal yang Anda jawab bukan soal aktif berikutnya dalam sesi pretest ini.",
      });
    }

    let questionStateBeforeAnswer = null;
    if (currentQuestionId) {
      questionStateBeforeAnswer = await getPretestQuestionState(pretest);
    } else {
      questionStateBeforeAnswer = await getPretestQuestionState(pretest);
      if (
        !questionStateBeforeAnswer.nextQuestion ||
        questionStateBeforeAnswer.nextQuestion._id.toString() !== question_id
      ) {
        return res.status(409).json({
          statusCode: 409,
          success: false,
          message:
            "Soal yang Anda jawab bukan soal aktif berikutnya dalam sesi pretest ini.",
        });
      }
    }

    const isCorrect =
      String(question.correct_answer) === String(selected_answer);
    const answerSequence = await PertanyaanPretest.countDocuments({
      pretest_id: pretestId,
    });
    const answerStage = questionStateBeforeAnswer.stage || "subbab";

    const answerRecord = await PertanyaanPretest.create({
      pretest_id: pretestId,
      soal_id: question_id,
      stage: answerStage,
      selected_answer: String(selected_answer),
      is_correct: isCorrect,
      response_time: response_time ?? null,
      sequence: answerSequence + 1,
      answered_at: new Date(),
    });

    const {
      totalQuestions,
      remainingQuestions,
      nextQuestionSequence,
      stage,
      nextQuestion,
    } = await getPretestQuestionState(pretest);

    const nextQuestionPayload = nextQuestion
      ? {
          ...serializeQuestion(nextQuestion),
          stage: stage || "subbab",
        }
      : null;

    if (nextQuestionPayload) {
      await Pretest.findByIdAndUpdate(pretestId, {
        current_question_id: new mongoose.Types.ObjectId(
          nextQuestionPayload.question_id,
        ),
      });
    } else {
      await Pretest.findByIdAndUpdate(pretestId, { current_question_id: null });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Jawaban berhasil disimpan.",
      data: {
        pretest_id: pretestId,
        bab_id: pretest.bab_id,
        stage: answerStage,
        is_correct: isCorrect,
        answer_record_id: answerRecord._id,
        sequence: answerRecord.sequence,
        total_questions: totalQuestions,
        progress: Math.round(((answerSequence + 1) / totalQuestions) * 100),
        next_question: nextQuestionPayload,
        next_question_sequence: nextQuestionSequence,
        next_stage: stage || "subbab",
        is_last_question: !nextQuestionPayload,
      },
    });
  } catch (error) {
    console.error("Answer pretest question error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat menyimpan jawaban pretest.",
      error: error.message,
    });
  }
};

const submitPretest = async (req, res) => {
  try {
    const { pretestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pretestId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "pretestId tidak valid.",
      });
    }

    const pretest = await Pretest.findById(pretestId);

    if (!pretest) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pretest tidak ditemukan.",
      });
    }

    if (pretest.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Anda tidak memiliki akses ke pretest ini.",
      });
    }

    if (pretest.completed_at) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Pretest ini sudah diselesaikan sebelumnya.",
      });
    }

    const {
      questions: allPretestQuestions,
      totalQuestions: expectedTotalQuestions,
    } = await getPretestQuestionPool(pretest.bab_id.toString());
    const answeredRecords = await PertanyaanPretest.find({
      pretest_id: pretestId,
    })
      .populate("soal_id")
      .lean();

    const answeredQuestionIds = new Set(
      answeredRecords.map((record) => record.soal_id._id.toString()),
    );
    const missingQuestionCount = Math.max(
      0,
      expectedTotalQuestions - answeredRecords.length,
    );

    if (missingQuestionCount > 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: `Pretest belum lengkap, masih ada ${missingQuestionCount} soal yang belum dijawab.`,
      });
    }

    const totalQuestions = expectedTotalQuestions;
    const correctAnswers = answeredRecords.filter(
      (record) => record.is_correct,
    ).length;
    const score = Number(((correctAnswers / totalQuestions) * 100).toFixed(2));

    pretest.score = mongoose.Types.Decimal128.fromString(score.toString());
    pretest.completed_at = new Date();
    pretest.duration = pretest.started_at
      ? Math.max(
          0,
          Math.round((pretest.completed_at - pretest.started_at) / 1000),
        )
      : null;

    await pretest.save();

    const questionMap = new Map(
      allPretestQuestions.map((question) => [
        question._id.toString(),
        question,
      ]),
    );

    const subbabPerformance = new Map();

    for (const record of answeredRecords) {
      const question = questionMap.get(record.soal_id._id.toString());
      if (!question || !question.subbab_id || record.stage === "prerequisite") {
        continue;
      }

      const subbabId = question.subbab_id.toString();
      const performance = subbabPerformance.get(subbabId) || {
        correct: 0,
        total: 0,
      };

      performance.total += 1;
      performance.correct += record.is_correct ? 1 : 0;
      subbabPerformance.set(subbabId, performance);
    }

    const difficultySummary = [];

    for (const [subbabId, performance] of subbabPerformance) {
      const subbabDifficulty = getSubbabDifficultyFromPerformance(
        performance.correct,
        performance.total,
      );

      const difficultyRecord = await UserProficiency.findOneAndUpdate(
        {
          user_id: req.user.id,
          subbab_id: subbabId,
        },
        {
          $set: {
            user_id: req.user.id,
            subbab_id: subbabId,
            current_cognitive_level: subbabDifficulty.difficulty,
            current_cognitive_score: subbabDifficulty.score,
            pretest_subbab_correct: performance.correct,
            pretest_subbab_total: performance.total,
            updated_at: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      difficultySummary.push({
        subbab_id: difficultyRecord.subbab_id,
        current_cognitive_level: difficultyRecord.current_cognitive_level,
        current_cognitive_score: difficultyRecord.current_cognitive_score,
        pretest_subbab_correct: difficultyRecord.pretest_subbab_correct,
        pretest_subbab_total: difficultyRecord.pretest_subbab_total,
        updated_at: difficultyRecord.updated_at,
      });
    }

    const babBreakdown = await getPretestBabBreakdown(
      pretest.bab_id,
      answeredRecords,
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Pretest berhasil diselesaikan.",
      data: {
        pretest_id: pretest._id,
        bab_id: pretest.bab_id,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        status: "completed",
        current_bab_summary: babBreakdown.current_bab,
        prerequisite_bab_summary: babBreakdown.prerequisite_babs,
        prerequisite_proficiency: babBreakdown.prerequisite_proficiency,
        difficulty: difficultySummary,
      },
    });
  } catch (error) {
    console.error("Submit pretest error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat finalisasi pretest.",
      error: error.message,
    });
  }
};

const getPretestResult = async (req, res) => {
  try {
    const { pretestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pretestId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "pretestId tidak valid.",
      });
    }

    const pretest = await Pretest.findById(pretestId).lean();

    if (!pretest) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pretest tidak ditemukan.",
      });
    }

    if (pretest.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Anda tidak memiliki akses ke hasil pretest ini.",
      });
    }

    if (!pretest.completed_at) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Pretest belum diselesaikan, hasil tidak tersedia.",
      });
    }

    const answerRecords = await PertanyaanPretest.find({
      pretest_id: pretestId,
    })
      .populate("soal_id")
      .lean();

    const questions = await Pertanyaan.find({
      _id: { $in: answerRecords.map((record) => record.soal_id._id) },
    }).lean();

    const questionMap = new Map(
      questions.map((question) => [question._id.toString(), question]),
    );

    const targetSubbabRecords = await Subbab.find({
      bab_id: pretest.bab_id,
    })
      .select("_id name")
      .lean();
    const targetSubbabMap = new Map(
      targetSubbabRecords.map((subbab) => [subbab._id.toString(), subbab]),
    );
    const difficultyRecords = await UserProficiency.find({
      user_id: req.user.id,
      subbab_id: { $in: [...targetSubbabMap.keys()] },
    })
      .select(
        "subbab_id current_cognitive_level current_cognitive_score pretest_subbab_correct pretest_subbab_total updated_at",
      )
      .lean();
    const difficultySnapshot = pretest.difficulty_snapshot?.length
      ? pretest.difficulty_snapshot
      : difficultyRecords.map((record) => {
          const pretestDifficulty = getSubbabDifficultyFromPerformance(
            record.pretest_subbab_correct,
            record.pretest_subbab_total,
          );
          return {
            ...record,
            current_cognitive_level: pretestDifficulty.difficulty,
            current_cognitive_score: pretestDifficulty.score,
          };
        });
    const difficultyMap = new Map(
      difficultyRecords.map((record) => [record.subbab_id.toString(), record]),
    );

    const subbabPerformanceMap = new Map();

    for (const record of answerRecords) {
      const question = questionMap.get(record.soal_id._id.toString());
      if (!question || !question.subbab_id) continue;

      const subbabId = question.subbab_id.toString();
      const targetSubbab = targetSubbabMap.get(subbabId);
      if (!targetSubbab) continue;

      const current = subbabPerformanceMap.get(subbabId) || {
        subbab_id: subbabId,
        subbab_name: targetSubbab.name,
        correct: 0,
        total: 0,
      };

      current.total += 1;
      current.correct += record.is_correct ? 1 : 0;
      subbabPerformanceMap.set(subbabId, current);
    }

    const subbabResultSummary = [];
    for (const item of subbabPerformanceMap.values()) {
      const difficulty = difficultyMap.get(item.subbab_id);
      const currentCognitiveLevel =
        difficulty?.current_cognitive_level ?? "easy";
      const currentCognitiveScore = difficulty?.current_cognitive_score ?? 600;

      subbabResultSummary.push({
        subbab_id: item.subbab_id,
        subbab_name: item.subbab_name,
        current_cognitive_level: currentCognitiveLevel,
        current_cognitive_score: `${currentCognitiveScore}/1400`,
      });
    }

    const score = pretest.score ? decimalToNumber(pretest.score) : 0;

    const babBreakdown = await getPretestBabBreakdown(
      pretest.bab_id,
      answerRecords,
    );

    const prerequisiteBabIds = (babBreakdown.prerequisite_babs || []).map(
      (item) => item.bab_id,
    );
    const prerequisiteBabNames = await Bab.find({
      _id: { $in: prerequisiteBabIds },
    })
      .select("_id name")
      .lean();
    const prerequisiteBabNameMap = new Map(
      prerequisiteBabNames.map((bab) => [bab._id.toString(), bab.name]),
    );

    const recommendations = [];

    const prerequisiteRecommendations = (
      babBreakdown.prerequisite_babs || []
    ).map((item) => {
      const isPrerequisiteMet = item.correct_answers === item.total_questions;
      const status = isPrerequisiteMet ? "terpenuhi" : "tidak terpenuhi";
      const babName =
        prerequisiteBabNameMap.get(item.bab_id.toString()) || "Bab prasyarat";

      return {
        type: "prerequisite",
        priority: isPrerequisiteMet ? "low" : "high",
        name: babName,
        status,
        message: isPrerequisiteMet
          ? `Bab prasyarat ${babName} sudah terpenuhi. Lanjutkan ke materi bab ini.`
          : `Bab prasyarat ${babName} belum terpenuhi. Pelajari kembali materi prasyarat sebelum melanjutkan ke bab ini.`,
      };
    });

    recommendations.push(...prerequisiteRecommendations);

    for (const subbab of subbabResultSummary) {
      const currentCognitiveScore = Number(
        String(subbab.current_cognitive_score).split("/")[0] || 600,
      );
      const cognitiveLevel = subbab.current_cognitive_level || "easy";

      if (currentCognitiveScore === 600 || cognitiveLevel === "easy") {
        recommendations.push({
          type: "subbab",
          priority: "high",
          name: subbab.subbab_name,
          status: cognitiveLevel,
          message: `Prioritaskan mempelajari ulang subbab ${subbab.subbab_name} sebelum melanjutkan ke latihan berikutnya.`,
        });
      } else if (
        currentCognitiveScore === 1000 ||
        cognitiveLevel === "medium"
      ) {
        recommendations.push({
          type: "subbab",
          priority: "medium",
          name: subbab.subbab_name,
          status: cognitiveLevel,
          message: `Perkuat pemahaman subbab ${subbab.subbab_name} dengan latihan tambahan sebelum melanjutkan.`,
        });
      } else if (currentCognitiveScore === 1400 || cognitiveLevel === "hard") {
        recommendations.push({
          type: "subbab",
          priority: "high",
          name: subbab.subbab_name,
          status: cognitiveLevel,
          message: `Lanjutkan penguatan di subbab ${subbab.subbab_name} agar tetap stabil dan lebih siap untuk materi berikutnya.`,
        });
      }
    }

    if (!recommendations.length) {
      recommendations.push({
        type: "positive",
        priority: "low",
        message:
          "Penguasaan seluruh subbab target sudah baik. Lanjutkan ke latihan untuk mempertahankan kemampuan.",
      });
    }

    const recommendation = recommendations
      .map((item) => item.message)
      .join("\n");

    const correctAnswers = answerRecords.filter(
      (record) => record.is_correct,
    ).length;
    const totalWrongAnswers = Math.max(
      0,
      answerRecords.length - correctAnswers,
    );
    const duration = pretest.started_at
      ? Math.max(
          0,
          Math.round(
            (new Date(pretest.completed_at) - new Date(pretest.started_at)) /
              1000,
          ),
        )
      : null;

    const prerequisiteBabSummary = (babBreakdown.prerequisite_babs || []).map(
      (item) => ({
        name: prerequisiteBabNameMap.get(item.bab_id.toString()) || "Unknown",
        status:
          item.correct_answers === item.total_questions
            ? "terpenuhi"
            : "tidak terpenuhi",
      }),
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Hasil pretest berhasil diambil.",
      data: {
        pretest_id: pretestId,
        bab_id: pretest.bab_id,
        score,
        total_questions: answerRecords.length,
        correct_answers: correctAnswers,
        wrong_answers: totalWrongAnswers,
        duration,
        prerequisite_bab_result: prerequisiteBabSummary,
        submateri_result: subbabResultSummary,
        recommendations,
        recommendation,
      },
    });
  } catch (error) {
    console.error("Get pretest result error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat mengambil hasil pretest.",
      error: error.message,
    });
  }
};

const getPretestReview = async (req, res) => {
  try {
    const { pretestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pretestId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "pretestId tidak valid.",
      });
    }

    const pretest = await Pretest.findById(pretestId).lean();

    if (!pretest) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pretest tidak ditemukan.",
      });
    }

    if (pretest.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Anda tidak memiliki akses ke review pretest ini.",
      });
    }

    if (!pretest.completed_at) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Review hanya tersedia setelah pretest diselesaikan.",
      });
    }

    const answerRecords = await PertanyaanPretest.find({
      pretest_id: pretestId,
    })
      .sort({ sequence: 1 })
      .populate("soal_id")
      .lean();

    const questions = answerRecords
      .filter((record) => record.soal_id)
      .map((record) => ({
        question_id: record.soal_id._id.toString(),
        sequence: record.sequence,
        stage: record.stage,
        question_text: record.soal_id.soal_text,
        soal_type: record.soal_id.soal_type || null,
        options: Array.isArray(record.soal_id.options)
          ? record.soal_id.options.map((option) => ({
              option_id: option.option_id,
              text: option.text,
            }))
          : [],
        image_url: Array.isArray(record.soal_id.image_url)
          ? record.soal_id.image_url
          : [],
        selected_answer: record.selected_answer,
        correct_answer: record.soal_id.correct_answer,
        is_correct: Boolean(record.is_correct),
        response_time: record.response_time ?? null,
      }));

    const correctAnswers = questions.filter(
      (question) => question.is_correct,
    ).length;

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Review pretest berhasil diambil.",
      data: {
        pretest_id: pretestId,
        bab_id: pretest.bab_id,
        score: pretest.score ? decimalToNumber(pretest.score) : 0,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        wrong_answers: Math.max(0, questions.length - correctAnswers),
        duration: pretest.duration ?? null,
        questions,
      },
    });
  } catch (error) {
    console.error("Get pretest review error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat mengambil review pretest.",
      error: error.message,
    });
  }
};

const discardPretest = async (req, res) => {
  try {
    const { pretestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pretestId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "pretestId tidak valid.",
      });
    }

    const pretest = await Pretest.findById(pretestId);

    if (!pretest) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pretest tidak ditemukan.",
      });
    }

    if (pretest.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Anda tidak memiliki akses untuk membatalkan pretest ini.",
      });
    }

    if (pretest.completed_at) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Pretest yang sudah selesai tidak dapat dibatalkan.",
      });
    }

    await PertanyaanPretest.deleteMany({ pretest_id: pretestId });
    await Pretest.findByIdAndDelete(pretestId);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Sesi pretest berhasil dibatalkan.",
      data: {
        pretest_id: pretestId,
        discarded: true,
      },
    });
  } catch (error) {
    console.error("Discard pretest error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat membatalkan sesi pretest.",
      error: error.message,
    });
  }
};

module.exports = {
  getPretestStatus,
  getExpectedQuestionBudget,
  getPretestQuestionPool,
  getPretestQuestionState,
  startPretest,
  getNextQuestion,
  answerPretestQuestion,
  submitPretest,
  getPretestResult,
  getPretestReview,
  discardPretest,
};
