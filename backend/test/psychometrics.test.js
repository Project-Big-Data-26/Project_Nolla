const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeItem } = require('../src/services/psychometrics');

test('item analysis calculates difficulty, discrimination, distractors, and time', () => {
  const responses = Array.from({ length: 100 }, (_, index) => ({
    isCorrect: index < 60, selectedAnswer: index < 60 ? 'B' : ['A', 'C', 'D'][index % 3],
    responseTimeMs: 30000 + index * 100, totalScore: 100 - index, validForAnalysis: true, rapidGuess: false,
  }));
  const result = analyzeItem(responses, ['A', 'B', 'C', 'D']);
  assert.equal(result.validResponseCount, 100); assert.equal(result.difficultyIndex, 0.6);
  assert.equal(result.empiricalDifficulty, 'Medium'); assert.ok(result.discriminationIndex > 0.2);
  assert.equal(result.distractorEfficiency, 1); assert.ok(result.medianResponseTimeMs > 30000);
});

test('missing or partial response time is unknown, not a rapid guess', () => {
  const responses = [
    { isCorrect: true, selectedAnswer: 'B', responseTimeMs: null },
    { isCorrect: false, selectedAnswer: 'A', responseTimeMs: undefined },
    { isCorrect: true, selectedAnswer: 'B', responseTimeMs: 500, timingPartial: true },
    { isCorrect: true, selectedAnswer: 'B', responseTimeMs: 1000 },
    { isCorrect: false, selectedAnswer: 'C', responseTimeMs: 20000 },
  ];
  const result = analyzeItem(responses, ['A', 'B', 'C'], { rapidGuessThresholdMs: 3000 });
  assert.equal(result.validResponseCount, 4, 'hanya respons 1000 ms yang rapid guess');
  assert.equal(result.rapidGuessRate, 1 / 5);
  assert.equal(result.timedResponseCount, 1);
  assert.equal(result.timingCoverage, 1 / 4);
  assert.equal(result.medianResponseTimeMs, 20000);
});

test('no measured time yields null time statistics instead of NaN', () => {
  const result = analyzeItem([{ isCorrect: true, selectedAnswer: 'B', responseTimeMs: null }], ['A', 'B']);
  assert.equal(result.medianResponseTimeMs, null);
  assert.equal(result.responseTimeIqrMs, null);
  assert.equal(result.timingCoverage, 0);
});
