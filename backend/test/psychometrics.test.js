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
