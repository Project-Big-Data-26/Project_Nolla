const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  annotatorId: { type: String, required: true }, role: { type: String, enum: ['author', 'independent_reviewer', 'adjudicator'], required: true },
  bloomLevel: { type: String, enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], required: true },
  knowledgeDimension: { type: String, enum: ['factual', 'conceptual', 'procedural', 'metacognitive'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true }, justification: String,
  expertiseStatus: { type: String, enum: ['verified'], required: true },
  expertiseScore: { type: Number, min: 0, max: 1 },
  rubricVersion: { type: String, default: '1.0' },
}, { timestamps: true, _id: true });

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true, unique: true, index: true }, subject: { type: String, required: true, default: 'Matematika' },
  grade: { type: Number, min: 1, max: 12, required: true }, topic: { type: String, required: true }, subtopic: { type: String, required: true },
  questionType: { type: String, required: true }, questionText: { type: String, required: true }, options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed, explanation: String, sourceReference: String,
  authorClaim: { bloomLevel: String, knowledgeDimension: String, difficulty: String, reasoningSteps: Number, justification: String },
  annotations: [annotationSchema], modelSuggestion: mongoose.Schema.Types.Mixed, psychometricSnapshot: mongoose.Schema.Types.Mixed,
  finalLabels: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['draft', 'pending_review', 'needs_adjudication', 'pilot_ready', 'calibrated', 'published', 'needs_revision'], default: 'draft', index: true },
  contentVersion: { type: Number, default: 1 },
}, { timestamps: true, collection: 'questions' });

module.exports = mongoose.model('Question', questionSchema);
