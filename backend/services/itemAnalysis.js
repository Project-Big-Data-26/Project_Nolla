// Analisis mutu butir soal dari attempt kuis yang sudah selesai (tanpa akses database).
const { analyzeItem } = require("../src/services/psychometrics");
const { getQuestionContentHash } = require("../utils/questionContent");

const UNKNOWN_VERSION = "unknown";
const CRITERION =
  "attempt_correct_count_within_same_subbab_track_and_content_version";

/**
 * Satu baris per jawaban final. Tidak memuat user, nama, atau email;
 * attempt hanya dipakai untuk menghitung total skor attempt.
 */
const toItemResponses = (attempts) =>
  attempts.flatMap((attempt) => {
    const correctCount = attempt.soal.filter((item) => item.is_correct).length;

    return attempt.soal.map((item) => ({
      questionId: item.soal_id.toString(),
      contentVersion: item.content_hash ?? UNKNOWN_VERSION,
      track: attempt.cognitive_level ?? "unknown",
      formLength: attempt.soal.length,
      selectedAnswer: item.pilihan_jawaban ?? null,
      correctOptionId: item.kunci_jawaban ?? null,
      isCorrect: item.is_correct === true,
      // Kontrak lama detik tidak dikonversi diam-diam; hanya *_ms yang dipakai.
      responseTimeMs: Number.isFinite(item.response_time_ms)
        ? item.response_time_ms
        : null,
      timingPartial: item.response_time_partial === true,
      totalScore: correctCount,
    }));
  });

const segmentKey = (response) =>
  [response.questionId, response.contentVersion, response.track, response.formLength].join("|");

/**
 * Total skor antar-attempt hanya sebanding bila soal berasal dari subbab, track,
 * panjang tes, dan versi konten yang sama; karena itu analisis dilakukan per segmen.
 */
const analyzeItemBank = (responses, questionsById, options = {}) => {
  const minResponses = options.minResponses ?? 1;
  const segments = new Map();
  for (const response of responses) {
    const key = segmentKey(response);
    if (!segments.has(key)) segments.set(key, []);
    segments.get(key).push(response);
  }

  const results = [];
  for (const group of segments.values()) {
    if (group.length < minResponses) continue;
    const { questionId, contentVersion, track, formLength } = group[0];
    const question = questionsById.get(questionId);
    const currentVersion = question ? getQuestionContentHash(question) : null;
    const isCurrentVersion = contentVersion !== UNKNOWN_VERSION && contentVersion === currentVersion;

    // Opsi versi lama tidak tersimpan: pakai opsi saat ini hanya bila versinya sama.
    const optionIds = [
      ...new Set([
        ...(isCurrentVersion ? (question.options ?? []).map((option) => option.option_id) : []),
        ...group.map((response) => response.selectedAnswer).filter((value) => value != null),
      ]),
    ].sort();
    const correctOptionId =
      group.find((response) => response.correctOptionId)?.correctOptionId ??
      (isCurrentVersion ? question.jawaban : undefined);

    let analysis;
    try {
      analysis = analyzeItem(group, optionIds, {
        correctOptionId,
        rapidGuessThresholdMs: options.rapidGuessThresholdMs,
      });
    } catch {
      // Semua respons tersaring (mis. rapid guess); laporkan tanpa statistik.
      analysis = null;
    }

    const flags = [
      ...(analysis?.reviewFlags ?? ["no_valid_response"]),
      ...(contentVersion === UNKNOWN_VERSION ? ["content_version_unknown"] : []),
      ...(question && !isCurrentVersion && contentVersion !== UNKNOWN_VERSION ? ["content_changed_since"] : []),
      ...(!question ? ["question_deleted"] : []),
    ];

    results.push({
      question_id: questionId,
      subbab_id: question?.subbab_id?.toString() ?? null,
      content_version: contentVersion,
      is_current_version: isCurrentVersion,
      track,
      form_length: formLength,
      response_count: group.length,
      correct_option_id: correctOptionId ?? null,
      analysis,
      review_flags: [...new Set(flags)],
    });
  }

  return results.sort(
    (a, b) =>
      String(a.subbab_id).localeCompare(String(b.subbab_id)) ||
      a.question_id.localeCompare(b.question_id) ||
      b.response_count - a.response_count,
  );
};

module.exports = { CRITERION, UNKNOWN_VERSION, analyzeItemBank, toItemResponses };
