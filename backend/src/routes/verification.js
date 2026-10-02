const express = require('express');
const { verifyExpertise } = require('../services/expertiseVerification');
const router = express.Router();

router.post('/educator', (req, res) => {
  const { profile, evidence } = req.body;
  if (!profile || !Array.isArray(evidence)) return res.status(422).json({ error: 'profile_and_evidence_required' });
  res.json(verifyExpertise(profile, evidence));
});
router.get('/educator/demo', (_req, res) => res.json(verifyExpertise(
  { teacherId: 'TEACHER-DEMO-01', subject: 'Matematika' },
  [
    { provider: 'dapodik', identityMatch: true, subject: 'Guru Matematika', current: true },
    { provider: 'pddikti', identityMatch: true, subject: 'Pendidikan Matematika', current: true },
    { provider: 'certification', identityMatch: true, subject: 'Matematika', current: true },
  ],
)));
module.exports = router;
