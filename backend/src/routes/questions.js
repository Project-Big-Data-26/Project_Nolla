const express = require('express');
const Ajv = require('ajv');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const questionSchema = require('../schemas/question.schema');
const { decideAnnotationStatus } = require('../services/annotationWorkflow');

const router = express.Router(); const validate = new Ajv({ allErrors: true }).compile(questionSchema);

router.post('/validate', (req, res) => {
  const valid = validate(req.body);
  res.status(valid ? 200 : 422).json({ valid, errors: valid ? [] : validate.errors });
});

router.post('/', async (req, res, next) => {
  try {
    if (!validate(req.body)) return res.status(422).json({ error: 'invalid_question', details: validate.errors });
    if (req.body.questionType.startsWith('multiple') && (!Array.isArray(req.body.options) || req.body.options.length < 2)) {
      return res.status(422).json({ error: 'invalid_options', message: 'Multiple-choice questions require at least two options.' });
    }
    const payload = { ...req.body, status: 'pending_review' };
    if (mongoose.connection.readyState !== 1) return res.status(202).json({ ...payload, persistence: 'skipped_database_unavailable' });
    const question = await Question.findOneAndUpdate({ questionId: payload.questionId }, payload, { upsert: true, new: true, runValidators: true });
    res.status(201).json(question);
  } catch (error) { next(error); }
});

router.get('/:questionId', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'database_unavailable' });
    const question = await Question.findOne({ questionId: req.params.questionId }).lean();
    if (!question) return res.status(404).json({ error: 'question_not_found' });
    res.json(question);
  } catch (error) { next(error); }
});

router.post('/:questionId/annotations', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'database_unavailable' });
    const allowedRoles = ['independent_reviewer', 'adjudicator'];
    const required = ['annotatorId', 'role', 'bloomLevel', 'knowledgeDimension', 'difficulty', 'justification', 'expertiseStatus'];
    const missing = required.filter((field) => req.body[field] === undefined || req.body[field] === '');
    if (missing.length) return res.status(422).json({ error: 'missing_annotation_fields', fields: missing });
    if (!allowedRoles.includes(req.body.role)) return res.status(422).json({ error: 'invalid_annotation_role' });
    if (req.body.expertiseStatus !== 'verified') return res.status(403).json({ error: 'verified_expertise_required' });
    if (!['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(req.body.bloomLevel)
      || !['factual', 'conceptual', 'procedural', 'metacognitive'].includes(req.body.knowledgeDimension)
      || !['Easy', 'Medium', 'Hard'].includes(req.body.difficulty)) {
      return res.status(422).json({ error: 'invalid_annotation_labels' });
    }

    const question = await Question.findOne({ questionId: req.params.questionId });
    if (!question) return res.status(404).json({ error: 'question_not_found' });
    if (question.annotations.some((item) => item.annotatorId === req.body.annotatorId && item.role === 'independent_reviewer')) {
      return res.status(409).json({ error: 'duplicate_independent_reviewer' });
    }
    if (req.body.role === 'adjudicator' && question.status !== 'needs_adjudication') {
      return res.status(409).json({ error: 'adjudication_not_required' });
    }

    question.annotations.push(req.body);
    const workflow = decideAnnotationStatus(question.annotations.map((item) => item.toObject()));
    question.status = workflow.status;
    question.finalLabels = workflow.finalLabels;
    await question.save();
    res.status(201).json({ questionId: question.questionId, annotationCount: question.annotations.length, ...workflow });
  } catch (error) { next(error); }
});

module.exports = router;
