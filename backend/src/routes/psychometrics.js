const express = require('express');
const mongoose = require('mongoose');
const { analyzeItem } = require('../services/psychometrics');
const StudentResponse = require('../models/StudentResponse');
const Question = require('../models/Question');
const router = express.Router();
router.post('/item-analysis', (req, res, next) => {
  try { res.json(analyzeItem(req.body.responses || [], req.body.optionIds || [], { correctOptionId: req.body.correctOptionId, rapidGuessThresholdMs: req.body.rapidGuessThresholdMs })); }
  catch (error) { error.status = 422; next(error); }
});

router.post('/items/:questionId/calibrate', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'database_unavailable' });
    const question = await Question.findOne({ questionId: req.params.questionId });
    if (!question) return res.status(404).json({ error: 'question_not_found' });
    const responses = await StudentResponse.find({ questionId: req.params.questionId }).lean();
    const analysis = analyzeItem(responses, question.options || [], {
      correctOptionId: req.body.correctOptionId ?? question.correctAnswer,
      rapidGuessThresholdMs: req.body.rapidGuessThresholdMs,
    });
    const severeFlags = analysis.reviewFlags.filter((flag) => ['low_discrimination', 'non_functioning_distractor'].includes(flag));
    const recommendedDecision = analysis.validResponseCount < 100 ? 'collect_more' : severeFlags.length ? 'revise' : 'calibrated';
    question.psychometricSnapshot = { ...analysis, recommendedDecision, calculatedAt: new Date().toISOString() };
    if (recommendedDecision === 'calibrated' && question.status === 'pilot_ready') question.status = 'calibrated';
    await question.save();
    res.json({ questionId: question.questionId, recommendedDecision, ...analysis });
  } catch (error) { error.status = error.status || 422; next(error); }
});
module.exports = router;
