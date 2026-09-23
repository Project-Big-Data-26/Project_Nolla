module.exports = {
  $id: 'https://nalar.local/schemas/question.json', type: 'object', additionalProperties: false,
  required: ['questionId', 'subject', 'grade', 'topic', 'subtopic', 'questionType', 'questionText', 'authorClaim'],
  properties: {
    questionId: { type: 'string', minLength: 3, maxLength: 80 }, subject: { const: 'Matematika' },
    grade: { type: 'integer', minimum: 1, maximum: 12 }, topic: { type: 'string', minLength: 2, maxLength: 120 },
    subtopic: { type: 'string', minLength: 2, maxLength: 120 },
    questionType: { enum: ['multiple_choice', 'multiple_response', 'true_false', 'numeric', 'short_answer', 'essay', 'matching'] },
    questionText: { type: 'string', minLength: 10, maxLength: 10000 },
    options: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 2, maxItems: 8 },
    correctAnswer: {}, explanation: { type: 'string', maxLength: 10000 }, sourceReference: { type: 'string', maxLength: 1000 },
    authorClaim: {
      type: 'object', additionalProperties: false, required: ['bloomLevel', 'knowledgeDimension', 'difficulty', 'reasoningSteps'],
      properties: {
        bloomLevel: { enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'] },
        knowledgeDimension: { enum: ['factual', 'conceptual', 'procedural', 'metacognitive'] },
        difficulty: { enum: ['Easy', 'Medium', 'Hard'] },
        reasoningSteps: { type: 'integer', minimum: 1, maximum: 10 }, justification: { type: 'string', maxLength: 2000 },
      },
    },
  },
};
