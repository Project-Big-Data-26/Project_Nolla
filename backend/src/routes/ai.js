const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const router = express.Router(); const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const aiBaseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function forwardJson(path, payload) {
  const response = await fetch(`${aiBaseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Object.assign(new Error(`AI service returned ${response.status}`), { status: 502, code: 'ai_service_error' });
  return response.json();
}

router.post('/classify-question', async (req, res, next) => {
  try {
    const prediction = await forwardJson('/v1/classify', req.body);
    if (mongoose.connection.readyState === 1 && req.body.question_id) {
      await Question.updateOne({ questionId: req.body.question_id }, { $set: { modelSuggestion: prediction } });
    }
    res.json(prediction);
  }
  catch (error) { next(error); }
});
router.get('/model-info', async (_req, res, next) => {
  try { const response = await fetch(`${aiBaseUrl}/v1/model-info`, { signal: AbortSignal.timeout(5000) }); res.status(response.status).json(await response.json()); }
  catch (error) { next(error); }
});
router.post('/extract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ error: 'file_required' });
    const body = new FormData(); body.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    const response = await fetch(`${aiBaseUrl}/v1/extract`, { method: 'POST', body, signal: AbortSignal.timeout(60000) });
    res.status(response.status).json(await response.json());
  } catch (error) { next(error); }
});
module.exports = router;
