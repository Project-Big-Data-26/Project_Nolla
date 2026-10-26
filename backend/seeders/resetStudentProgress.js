const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");

const User = require("../models/User");
const Pretest = require("../models/MengerjakanPretest");
const PretestAnswer = require("../models/MenjawabSoalPretest");
const CancelledPretest = require("../models/PretestDibatalkan");
const Difficulty = require("../models/MendapatkanDifficulty");
const Quiz = require("../models/MengerjakanKuis");
const QuizAnswer = require("../models/MenjawabSoal");
const CompletedSubbab = require("../models/MenyelesaikanSubbab");

const ALLOWED_EMAILS = [
  "student@example.com",
  "student1@example.com",
  "student2@example.com",
];
const CONFIRMATION_PHRASE = "RESET-STUDENT-PROGRESS";
const DEFAULT_DIFFICULTY = {
  current_cognitive_level: "medium",
  current_cognitive_score: 1000,
  pretest_subbab_correct: 0,
  pretest_subbab_total: 0,
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmails = (rawEmails) =>
  [...new Set(
    rawEmails
      .flatMap((value) =>
        String(value ?? "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      )
      .filter(Boolean),
  )];

const usage = `Usage:
  npm run reset:quiz -- [--email student@example.com]
  npm run reset:pretest -- [--email student@example.com]

Tanpa --email, script akan memakai default target:
  ${ALLOWED_EMAILS.join(", ")}

Alternatif variabel environment:
  RESET_EMAIL="student@example.com" npm run reset:quiz
  RESET_EMAIL="student@example.com,student1@example.com" npm run reset:quiz
`;

const resolveTargetEmails = ({ cliEmails = [], envEmails = [] } = {}) => {
  const combined = normalizeEmails([
    ...envEmails,
    ...cliEmails,
  ]);

  if (combined.length) {
    const invalidEmails = combined.filter((email) => !EMAIL_PATTERN.test(email));
    if (invalidEmails.length) {
      throw new Error(
        `Email tidak valid: ${invalidEmails.join(", ")}. Gunakan format user@example.com.`,
      );
    }
    return combined;
  }

  return [...ALLOWED_EMAILS];
};

const parseArgs = (args) => {
  const parsed = { mode: null, emails: [], apply: false, confirmation: null };
  const envEmails = normalizeEmails([
    process.env.RESET_EMAIL || "",
    process.env.RESET_EMAILS || "",
  ]);

  if (envEmails.length && args.includes("--email")) {
    throw new Error(
      "Gunakan salah satu: --email atau RESET_EMAIL/RESET_EMAILS, jangan keduanya.",
    );
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help" || argument === "-h") {
      parsed.help = true;
      continue;
    }

    if (argument === "--apply") {
      parsed.apply = true;
      continue;
    }

    if (
      argument === "--mode" ||
      argument === "--email" ||
      argument === "--confirm"
    ) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Nilai wajib diberikan untuk ${argument}.`);
      }
      index += 1;

      if (argument === "--mode") {
        if (parsed.mode) {
          throw new Error("--mode hanya boleh diberikan sekali.");
        }
        parsed.mode = value;
      } else if (argument === "--email") {
        parsed.emails.push(...value.split(","));
      } else {
        if (parsed.confirmation) {
          throw new Error("--confirm hanya boleh diberikan sekali.");
        }
        parsed.confirmation = value;
      }
      continue;
    }

    throw new Error(`Argumen tidak dikenal: ${argument}`);
  }

  if (parsed.help) return parsed;
  if (!["reset-quiz", "reset-pretest"].includes(parsed.mode)) {
    throw new Error("--mode harus reset-quiz atau reset-pretest.");
  }
  if (parsed.confirmation && !parsed.apply) {
    throw new Error("--confirm hanya dapat digunakan bersama --apply.");
  }
  if (parsed.apply && parsed.confirmation !== CONFIRMATION_PHRASE) {
    throw new Error(
      `Mutasi memerlukan --apply --confirm ${CONFIRMATION_PHRASE}.`,
    );
  }

  parsed.emails = resolveTargetEmails({
    cliEmails: parsed.emails,
    envEmails,
  });
  parsed.emails = parsed.emails.filter((email) => !!email);

  if (!parsed.emails.length) {
    throw new Error("Email target tidak boleh kosong.");
  }

  return parsed;
};

const withSession = (query, session) =>
  session ? query.session(session) : query;

const getDifficultyRestoreOps = (
  existingRecords,
  completedPretests,
  userId,
) => {
  const scoresBySubbab = new Map();

  // Pretests are sorted newest-first so the first score for a subbab wins.
  for (const pretest of completedPretests) {
    for (const score of pretest.subbab_cognitive_scores || []) {
      const subbabId = score.subbab_id?.toString();
      if (subbabId && !scoresBySubbab.has(subbabId)) {
        scoresBySubbab.set(subbabId, score);
      }
    }
  }

  const subbabIds = new Set(
    existingRecords.map((record) => record.subbab_id.toString()),
  );
  for (const subbabId of scoresBySubbab.keys()) subbabIds.add(subbabId);

  return [...subbabIds].map((subbabId) => {
    const score = scoresBySubbab.get(subbabId) || DEFAULT_DIFFICULTY;
    return {
      updateOne: {
        filter: {
          user_id: userId,
          subbab_id: new mongoose.Types.ObjectId(subbabId),
        },
        update: {
          $set: {
            user_id: userId,
            subbab_id: new mongoose.Types.ObjectId(subbabId),
            current_cognitive_level: score.current_cognitive_level,
            current_cognitive_score: score.current_cognitive_score,
            pretest_subbab_correct: score.pretest_subbab_correct ?? 0,
            pretest_subbab_total: score.pretest_subbab_total ?? 0,
            updated_at: new Date(),
          },
        },
        upsert: true,
      },
    };
  });
};

const buildUserPlan = async (user, mode, session) => {
  const userId = user._id;
  const pretests = await withSession(
    Pretest.find({ user_id: userId })
      .select("_id completed_at subbab_cognitive_scores")
      .lean(),
    session,
  );
  const pretestIds = pretests.map((pretest) => pretest._id);

  const [
    pretestAnswerCount,
    quizCount,
    quizAnswerCount,
    completedSubbabCount,
    difficultyRecords,
  ] = await Promise.all([
    pretestIds.length
      ? withSession(
          PretestAnswer.countDocuments({ pretest_id: { $in: pretestIds } }),
          session,
        )
      : 0,
    withSession(Quiz.countDocuments({ user_id: userId }), session),
    withSession(QuizAnswer.countDocuments({ user_id: userId }), session),
    withSession(CompletedSubbab.countDocuments({ user_id: userId }), session),
    withSession(
      Difficulty.find({ user_id: userId }).select("subbab_id").lean(),
      session,
    ),
  ]);

  const completedPretests = pretests
    .filter((pretest) => pretest.completed_at)
    .sort(
      (left, right) =>
        new Date(right.completed_at) - new Date(left.completed_at) ||
        right._id.toString().localeCompare(left._id.toString()),
    );

  const difficultyOps =
    mode === "reset-quiz"
      ? getDifficultyRestoreOps(difficultyRecords, completedPretests, userId)
      : [];

  return {
    user,
    mode,
    pretestIds,
    pretestAnswerCount: mode === "reset-pretest" ? pretestAnswerCount : 0,
    pretestCount: mode === "reset-pretest" ? pretests.length : 0,
    quizCount,
    quizAnswerCount,
    completedSubbabCount,
    difficultyRecords,
    difficultyOps,
  };
};

const printPlan = (plan) => {
  console.log(`\n${plan.user.email}`);
  if (plan.mode === "reset-pretest") {
    console.log(`  pretest records to delete: ${plan.pretestCount}`);
    console.log(`  pretest answers to delete: ${plan.pretestAnswerCount}`);
  }
  console.log(`  quiz sessions to delete: ${plan.quizCount}`);
  console.log(`  quiz answer records to delete: ${plan.quizAnswerCount}`);
  console.log(
    `  completed-subbab markers to delete: ${plan.completedSubbabCount}`,
  );
  if (plan.mode === "reset-quiz") {
    console.log(
      `  difficulty records to restore from pretest/default: ${plan.difficultyOps.length}`,
    );
  } else {
    console.log(
      `  existing difficulty records to reset to medium/1000: ${plan.difficultyRecords.length}`,
    );
  }
};

const applyUserPlan = async (plan, session) => {
  const options = session ? { session } : {};
  const userId = plan.user._id;
  const summary = {};

  if (plan.mode === "reset-pretest") {
    const pretestAnswers = plan.pretestIds.length
      ? await PretestAnswer.deleteMany(
          { pretest_id: { $in: plan.pretestIds } },
          options,
        )
      : { deletedCount: 0 };
    const pretests = await Pretest.deleteMany({ user_id: userId }, options);
    const cancelledPretests = await CancelledPretest.deleteMany(
      { user_id: userId },
      options,
    );
    summary.pretestAnswersDeleted = pretestAnswers.deletedCount;
    summary.pretestsDeleted = pretests.deletedCount;
    summary.cancelledPretestsDeleted = cancelledPretests.deletedCount;
  }

  const quizzes = await Quiz.deleteMany({ user_id: userId }, options);
  const quizAnswers = await QuizAnswer.deleteMany({ user_id: userId }, options);
  const completedSubbabMarkers = await CompletedSubbab.deleteMany(
    { user_id: userId },
    options,
  );
  summary.quizzesDeleted = quizzes.deletedCount;
  summary.quizAnswersDeleted = quizAnswers.deletedCount;
  summary.completedSubbabMarkersDeleted = completedSubbabMarkers.deletedCount;

  if (plan.mode === "reset-quiz" && plan.difficultyOps.length) {
    const restored = await Difficulty.bulkWrite(plan.difficultyOps, options);
    summary.difficultyModified = restored.modifiedCount;
    summary.difficultyUpserted = restored.upsertedCount;
  } else if (plan.mode === "reset-pretest") {
    const reset = await Difficulty.updateMany(
      { user_id: userId },
      { $set: { ...DEFAULT_DIFFICULTY, updated_at: new Date() } },
      options,
    );
    summary.difficultyReset = reset.modifiedCount;
  }

  return summary;
};

const supportsTransactions = async () => {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  return Boolean(hello.setName || hello.msg === "isdbgrid");
};

const run = async () => {
  let session;
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage);
      return;
    }
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI belum diset di backend/.env.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB terhubung; mode: ${options.mode}`);
    console.log(
      options.apply
        ? "Mode APPLY aktif."
        : "Mode DRY-RUN: tidak ada data yang akan diubah.",
    );

    const users = await User.find({ email: { $in: options.emails } })
      .select("_id email")
      .lean();
    const usersByEmail = new Map(users.map((user) => [user.email, user]));

    for (const email of options.emails) {
      const user = usersByEmail.get(email);
      if (!user) {
        console.log(`\n${email}: user tidak ditemukan, dilewati.`);
        continue;
      }

      const plan = await buildUserPlan(user, options.mode);
      printPlan(plan);
      if (!options.apply) continue;

      const useTransactions = await supportsTransactions();
      if (useTransactions) {
        session = await mongoose.startSession();
        let summary;
        await session.withTransaction(async () => {
          const currentPlan = await buildUserPlan(user, options.mode, session);
          summary = await applyUserPlan(currentPlan, session);
        });
        await session.endSession();
        session = null;
        console.log("  transaction committed");
        console.log(`  result: ${JSON.stringify(summary)}`);
      } else {
        console.warn(
          "  WARNING: MongoDB bukan replica set; menjalankan tanpa transaction. Pastikan backup tersedia.",
        );
        const currentPlan = await buildUserPlan(user, options.mode);
        const summary = await applyUserPlan(currentPlan);
        console.log(`  result: ${JSON.stringify(summary)}`);
      }
    }

    if (!options.apply) {
      console.log(
        `\nPratinjau saja. Untuk menerapkan perubahan, tambahkan --apply --confirm ${CONFIRMATION_PHRASE}.`,
      );
    }
  } catch (error) {
    console.error("Reset student progress gagal:", error.message);
    process.exitCode = 1;
  } finally {
    if (session) await session.endSession();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  run();
}

module.exports = {
  ALLOWED_EMAILS,
  CONFIRMATION_PHRASE,
  DEFAULT_DIFFICULTY,
  getDifficultyRestoreOps,
  parseArgs,
};
