function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function pointBiserial(itemScores, correctedTotals) {
  if (itemScores.length !== correctedTotals.length || itemScores.length < 3) return null;
  const correct = correctedTotals.filter((_, index) => itemScores[index] === 1);
  const incorrect = correctedTotals.filter((_, index) => itemScores[index] === 0);
  if (!correct.length || !incorrect.length) return null;
  const totalMean = mean(correctedTotals);
  const variance = correctedTotals.reduce((sum, value) => sum + (value - totalMean) ** 2, 0) / (correctedTotals.length - 1);
  if (variance === 0) return null;
  const p = correct.length / itemScores.length; const q = 1 - p;
  return ((mean(correct) - mean(incorrect)) / Math.sqrt(variance)) * Math.sqrt(p * q);
}

function quantile(values, probability) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b); const position = (sorted.length - 1) * probability;
  const base = Math.floor(position); const remainder = position - base;
  return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + remainder * (sorted[base + 1] - sorted[base]);
}

function analyzeItem(responses, optionIds = [], options = {}) {
  const threshold = Number.isFinite(options.rapidGuessThresholdMs) ? options.rapidGuessThresholdMs : null;
  const normalized = responses.map((response) => ({ ...response, rapidGuess: response.rapidGuess === true || (threshold !== null && response.responseTimeMs < threshold) }));
  const valid = normalized.filter((response) => response.validForAnalysis !== false && !response.rapidGuess);
  if (!valid.length) throw new Error('At least one valid response is required');
  const correctCount = valid.filter((response) => response.isCorrect).length;
  const difficultyIndex = correctCount / valid.length;
  const sorted = [...valid].filter((response) => Number.isFinite(response.totalScore)).sort((a, b) => b.totalScore - a.totalScore);
  const groupSize = Math.max(1, Math.floor(sorted.length * 0.27));
  const upper = sorted.slice(0, groupSize); const lower = sorted.slice(-groupSize);
  const discriminationIndex = sorted.length >= 8
    ? upper.filter((response) => response.isCorrect).length / groupSize - lower.filter((response) => response.isCorrect).length / groupSize
    : null;
  const selection = Object.fromEntries(optionIds.map((option) => [option, valid.filter((response) => response.selectedAnswer === option).length]));
  const correctOptionId = options.correctOptionId ?? valid.find((response) => response.isCorrect)?.selectedAnswer;
  const distractors = optionIds.filter((option) => option !== correctOptionId);
  const distractorStats = distractors.map((option) => {
    const selectionRate = (selection[option] || 0) / valid.length;
    const upperRate = upper.length ? upper.filter((response) => response.selectedAnswer === option).length / upper.length : null;
    const lowerRate = lower.length ? lower.filter((response) => response.selectedAnswer === option).length / lower.length : null;
    const functions = selectionRate >= 0.05 && (lowerRate === null || upperRate === null || lowerRate > upperRate);
    return { optionId: option, selectionRate, upperRate, lowerRate, functions };
  });
  const functioningDistractors = distractorStats.filter((item) => item.functions).length;
  const times = valid.map((response) => response.responseTimeMs);
  return {
    validResponseCount: valid.length, difficultyIndex,
    empiricalDifficulty: difficultyIndex > 0.7 ? 'Easy' : difficultyIndex < 0.3 ? 'Hard' : 'Medium',
    discriminationIndex,
    correctedPointBiserial: sorted.length >= 3 ? pointBiserial(sorted.map((r) => r.isCorrect ? 1 : 0), sorted.map((r) => r.totalScore - (r.isCorrect ? 1 : 0))) : null,
    optionSelection: selection,
    distractorStats,
    distractorEfficiency: distractors.length ? functioningDistractors / distractors.length : null,
    medianResponseTimeMs: median(times), responseTimeIqrMs: quantile(times, 0.75) - quantile(times, 0.25),
    rapidGuessThresholdMs: threshold,
    rapidGuessRate: normalized.filter((response) => response.rapidGuess).length / normalized.length,
    analysisStatus: valid.length < 30 ? 'exploratory' : valid.length < 100 ? 'provisional' : 'operational_review',
    reviewFlags: [
      ...(difficultyIndex < 0.3 || difficultyIndex > 0.7 ? ['extreme_difficulty'] : []),
      ...(discriminationIndex !== null && discriminationIndex <= 0.2 ? ['low_discrimination'] : []),
      ...(distractors.length && functioningDistractors < distractors.length ? ['non_functioning_distractor'] : []),
      ...(threshold === null ? ['rapid_guess_threshold_not_calibrated'] : []),
      ...(valid.length < 100 ? ['limited_sample'] : []),
    ],
  };
}

module.exports = { analyzeItem, median, pointBiserial, quantile };
