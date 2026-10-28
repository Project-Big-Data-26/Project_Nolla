const getCognitiveLevel = (score) => {
  if (score >= 1400) return "hard";
  if (score >= 1000) return "medium";
  return "easy";
};

const MASTERY_RATING_THRESHOLD = 1600;
const PROGRESS_RATING_FLOOR = 600;

const getSubbabProgress = (score) => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore <= PROGRESS_RATING_FLOOR)
    return 0;
  if (numericScore >= MASTERY_RATING_THRESHOLD) return 100;

  return Math.round(
    ((numericScore - PROGRESS_RATING_FLOOR) /
      (MASTERY_RATING_THRESHOLD - PROGRESS_RATING_FLOOR)) *
      100,
  );
};

// Mastery saat ini: sudah pernah submit kuis subbab DAN rating terkini >= ambang.
// Berbeda dari "pernah submit kuis" (menyelesaikan_subbab) dan "pernah mencapai mastery" (belum dilacak).
const isSubbabMastered = (score, hasSubmittedQuiz) =>
  Boolean(hasSubmittedQuiz) &&
  Number.isFinite(Number(score)) &&
  Number(score) >= MASTERY_RATING_THRESHOLD;

const getBabProgress = (
  subbabList,
  difficultyBySubbabId,
  quizzedSubbabIds,
) => {
  if (subbabList.length === 0) return 0;

  const totalProgress = subbabList.reduce((total, subbab) => {
    if (!quizzedSubbabIds.has(subbab._id.toString())) return total;

    const score =
      difficultyBySubbabId.get(subbab._id.toString())
        ?.current_cognitive_score ?? 0;
    return total + getSubbabProgress(score);
  }, 0);

  return Math.round(totalProgress / subbabList.length);
};

module.exports = {
  getBabProgress,
  getCognitiveLevel,
  getSubbabProgress,
  isSubbabMastered,
  MASTERY_RATING_THRESHOLD,
};
