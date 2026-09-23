const test = require('node:test');
const assert = require('node:assert/strict');
const { decideAnnotationStatus } = require('../src/services/annotationWorkflow');

const annotation = (annotatorId, overrides = {}) => ({
  annotatorId, role: 'independent_reviewer', bloomLevel: 'C3',
  knowledgeDimension: 'procedural', difficulty: 'Medium', ...overrides,
});

test('two matching independent reviewers produce pilot-ready consensus', () => {
  const result = decideAnnotationStatus([annotation('A'), annotation('B')]);
  assert.equal(result.status, 'pilot_ready');
  assert.equal(result.decision, 'reviewer_consensus');
  assert.equal(result.finalLabels.bloomLevel, 'C3');
});

test('reviewer disagreement requires adjudication', () => {
  const result = decideAnnotationStatus([annotation('A'), annotation('B', { bloomLevel: 'C4' })]);
  assert.equal(result.status, 'needs_adjudication');
});

test('adjudicator resolves a disagreement', () => {
  const result = decideAnnotationStatus([
    annotation('A'), annotation('B', { difficulty: 'Hard' }),
    annotation('C', { role: 'adjudicator', difficulty: 'Hard' }),
  ]);
  assert.equal(result.status, 'pilot_ready');
  assert.equal(result.decision, 'adjudicated');
  assert.equal(result.finalLabels.difficulty, 'Hard');
});
