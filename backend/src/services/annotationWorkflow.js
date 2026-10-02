const LABEL_FIELDS = ['bloomLevel', 'knowledgeDimension', 'difficulty'];

function sameLabels(left, right) {
  return LABEL_FIELDS.every((field) => left[field] === right[field]);
}

function decideAnnotationStatus(annotations = []) {
  const adjudication = [...annotations].reverse().find((item) => item.role === 'adjudicator');
  if (adjudication) return { status: 'pilot_ready', decision: 'adjudicated', finalLabels: Object.fromEntries(LABEL_FIELDS.map((field) => [field, adjudication[field]])) };

  const reviewers = annotations.filter((item) => item.role === 'independent_reviewer');
  const uniqueReviewers = [...new Map(reviewers.map((item) => [item.annotatorId, item])).values()];
  if (uniqueReviewers.length < 2) return { status: 'pending_review', decision: 'awaiting_second_reviewer', finalLabels: null };
  if (!sameLabels(uniqueReviewers[0], uniqueReviewers[1])) return { status: 'needs_adjudication', decision: 'reviewer_disagreement', finalLabels: null };
  return { status: 'pilot_ready', decision: 'reviewer_consensus', finalLabels: Object.fromEntries(LABEL_FIELDS.map((field) => [field, uniqueReviewers[0][field]])) };
}

module.exports = { decideAnnotationStatus, sameLabels };
