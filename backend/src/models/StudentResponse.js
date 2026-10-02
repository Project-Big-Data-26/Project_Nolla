const mongoose = require('mongoose');
const responseSchema = new mongoose.Schema({
  questionId: { type: String, required: true, index: true }, studentHash: { type: String, required: true, index: true },
  assessmentId: { type: String, required: true, index: true }, selectedAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: { type: Boolean, required: true }, responseTimeMs: { type: Number, min: 0, required: true },
  answerChanges: { type: Number, min: 0, default: 0 }, rapidGuess: { type: Boolean, default: false },
  validForAnalysis: { type: Boolean, default: true },
}, { timestamps: true, collection: 'student_responses' });
module.exports = mongoose.model('StudentResponse', responseSchema);
