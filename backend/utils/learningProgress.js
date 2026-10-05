const getCognitiveLevel = (score) => {
  if (score >= 1400) return "hard";
  if (score >= 1000) return "medium";
  return "easy";
};

const getSubbabProgress = (score) => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore <= 600) return 0;
  if (numericScore >= 1600) return 100;

  return Math.round(((numericScore - 600) / 1000) * 100);
};

const isSubbabCompleted = (score) =>
  Number.isFinite(Number(score)) && Number(score) >= 1600;

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
  isSubbabCompleted,
};
