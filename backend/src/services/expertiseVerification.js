const PROVIDER_WEIGHTS = { dapodik: 0.35, pddikti: 0.3, certification: 0.35 };

function verifyExpertise(profile, evidence) {
  const normalizedSubject = String(profile.subject || '').toLowerCase();
  const results = evidence.map((item) => {
    const provider = String(item.provider || '').toLowerCase();
    const identityMatch = Boolean(item.identityMatch);
    const subjectMatch = String(item.subject || '').toLowerCase().includes(normalizedSubject);
    const current = item.current !== false;
    return { provider, identityMatch, subjectMatch, current, verified: identityMatch && subjectMatch && current, checkedAt: item.checkedAt || new Date().toISOString() };
  });
  const score = results.reduce((sum, result) => sum + (result.verified ? PROVIDER_WEIGHTS[result.provider] || 0 : 0), 0);
  const verifiedCount = results.filter((result) => result.verified).length;
  return {
    score: Number(score.toFixed(2)), verifiedCount,
    status: score >= 0.7 && verifiedCount >= 2 ? 'verified' : score >= 0.35 ? 'manual_review' : 'unverified',
    results,
    warning: 'Demo contract only. Live checks require authorized provider access and explicit consent.',
  };
}
module.exports = { verifyExpertise };
