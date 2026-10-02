const express = require('express');
const mongoose = require('mongoose');
const StudentResponse = require('../models/StudentResponse');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const required = ['questionId', 'studentHash', 'assessmentId', 'isCorrect', 'responseTimeMs'];
    const missing = required.filter((field) => req.body[field] === undefined || req.body[field] === '');
    if (missing.length) return res.status(422).json({ error: 'missing_fields', fields: missing });
    // Rapid guessing is calibrated per item during analysis; a global three-second
    // cutoff would incorrectly discard valid short responses.
    const payload = { ...req.body, rapidGuess: Boolean(req.body.rapidGuess) };
    if (mongoose.connection.readyState !== 1) return res.status(202).json({ ...payload, persistence: 'skipped_database_unavailable' });
    const response = await StudentResponse.create(payload); res.status(201).json(response);
  } catch (error) { next(error); }
});
module.exports = router;
