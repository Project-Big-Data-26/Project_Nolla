const Subbab = require("../models/Subbab");
const Soal = require("../models/Soal");
const BabPrasyarat = require("../models/MemilikiPrasyarat");

const LEVELS = ["easy", "medium", "hard"];

// Sama dengan level efektif kuis: score sah didahulukan dari label tersimpan.
// Metadata kosong/tidak sah tidak boleh dianggap sebagai stok easy.
const getPretestDifficulty = (question) => {
  const score = question?.cognitive_score;
  const numericScore = typeof score === "number" ? score
    : typeof score === "string" && score.trim() ? Number(score) : NaN;
  if (Number.isFinite(numericScore)) {
    if (numericScore >= 1400) return "hard";
    if (numericScore >= 1000) return "medium";
    return "easy";
  }
  return LEVELS.includes(question?.cognitive_level) ? question.cognitive_level : null;
};

const compareSubbab = (left, right) =>
  (left.display_order ?? -Infinity) - (right.display_order ?? -Infinity) ||
  String(left._id).localeCompare(String(right._id));

const pickPrerequisiteQuestion = (questions) => {
  const rating = (question) => Number.isFinite(Number(question.cognitive_score))
    ? Number(question.cognitive_score) : -Infinity;
  return [...questions].sort((left, right) =>
    rating(right) - rating(left) ||
    new Date(left.created_at ?? 0).getTime() - new Date(right.created_at ?? 0).getTime() ||
    String(left._id).localeCompare(String(right._id)),
  )[0];
};

// Mengembalikan pool yang sama dengan yang divalidasi. Caller hanya meneruskan
// can_start/total_questions/missing_requirements ke klien, bukan isi pool/kunci.
const checkPretestAvailability = async (babId) => {
  const chapterId = String(babId).toLowerCase();
  const relations = await BabPrasyarat.find({ bab_id: chapterId })
    .select("relasi_bab_id").sort({ relasi_bab_id: 1 }).lean();
  const prerequisiteIds = [...new Set(relations.map((item) => String(item.relasi_bab_id).toLowerCase()))];
  const subbabList = await Subbab.find({
    bab_id: { $in: [chapterId, ...prerequisiteIds] },
  }).select("_id bab_id display_order").lean();
  const currentSubbabs = subbabList.filter((item) => String(item.bab_id) === chapterId)
    .sort(compareSubbab);
  const prerequisiteSubbabs = prerequisiteIds.map((id) => {
    // display_order terbesar; jika seri, _id terkecil seperti selector lama.
    const list = subbabList.filter((item) => String(item.bab_id) === id);
    return [...list].sort((left, right) =>
      (right.display_order ?? -Infinity) - (left.display_order ?? -Infinity) ||
      String(left._id).localeCompare(String(right._id)),
    )[0] ?? null;
  });
  const subbabIds = [
    ...currentSubbabs.map((item) => item._id),
    ...prerequisiteSubbabs.filter(Boolean).map((item) => item._id),
  ];
  const candidates = subbabIds.length
    ? await Soal.find({ subbab_id: { $in: subbabIds }, status: { $ne: "inactive" } })
      .sort({ subbab_id: 1, created_at: 1, _id: 1 }).lean()
    : [];
  const questions = candidates.filter((item) => item.status !== "inactive" && getPretestDifficulty(item));
  const bySubbab = new Map();
  for (const question of questions) {
    const id = String(question.subbab_id);
    if (!bySubbab.has(id)) bySubbab.set(id, []);
    bySubbab.get(id).push(question);
  }
  const missing = [];
  const addMissing = (stage, chapterId, subbabId, difficulty, reason) => missing.push({
    stage, bab_id: String(chapterId), subbab_id: subbabId ? String(subbabId) : null,
    difficulty, required: 1, available: 0, reason,
  });
  if (!currentSubbabs.length) {
    addMissing("subbab", chapterId, null, null, "missing_subbab");
  }
  for (const subbab of currentSubbabs) {
    const available = new Set((bySubbab.get(String(subbab._id)) ?? []).map(getPretestDifficulty));
    for (const level of LEVELS) {
      if (!available.has(level)) addMissing("subbab", chapterId, subbab._id, level, "missing_question");
    }
  }
  const prerequisiteQuestions = [];
  for (let index = 0; index < prerequisiteIds.length; index++) {
    const prerequisiteId = prerequisiteIds[index];
    const subbab = prerequisiteSubbabs[index];
    if (prerequisiteId === chapterId) {
      addMissing("prerequisite", prerequisiteId, null, "hard", "invalid_prerequisite");
      continue;
    }
    if (!subbab) {
      addMissing("prerequisite", prerequisiteId, null, "hard", "missing_subbab");
      continue;
    }
    const hard = (bySubbab.get(String(subbab._id)) ?? [])
      .filter((item) => getPretestDifficulty(item) === "hard");
    if (!hard.length) {
      addMissing("prerequisite", prerequisiteId, subbab._id, "hard", "missing_question");
      continue;
    }
    prerequisiteQuestions.push(pickPrerequisiteQuestion(hard));
  }
  const babQuestions = currentSubbabs.flatMap((item) => bySubbab.get(String(item._id)) ?? []);
  // Target berasal dari struktur wajib, bukan jumlah soal yang berhasil ditemukan.
  const totalQuestions = prerequisiteIds.length + currentSubbabs.length * 2;
  return {
    can_start: missing.length === 0,
    total_questions: totalQuestions,
    missing_requirements: missing,
    pool: {
      babQuestions, prerequisiteQuestions,
      questions: [...prerequisiteQuestions, ...babQuestions],
      subbabIds: currentSubbabs.map((item) => item._id),
      subbabCount: currentSubbabs.length,
      prerequisiteQuestionLimit: prerequisiteIds.length,
      totalQuestions,
    },
  };
};

module.exports = { checkPretestAvailability, getPretestDifficulty };
