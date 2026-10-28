const AnalyticsEvent = require("../models/AnalyticsEvent");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MengerjakanPretest = require("../models/MengerjakanPretest");
const PretestDibatalkan = require("../models/PretestDibatalkan");
const {
  BROWSER_EVENTS,
  MAX_BATCH,
  validateBrowserEvent,
} = require("./analyticsEventSchema");
const {
  buildEnvelope,
  getAnalyticsUserId,
  getCohort,
  getConfig,
} = require("./analyticsService");

// Map attemptId -> Set(question_id) | null (pretest: soal tidak divalidasi per attempt).
const loadOwnedAttempts = async (userId, events) => {
  const idsByType = { quiz: new Set(), pretest: new Set() };
  for (const event of events) {
    if (event.assessment_attempt_id) {
      idsByType[event.assessment_type].add(event.assessment_attempt_id);
    }
  }

  const owned = { quiz: new Map(), pretest: new Map() };
  if (idsByType.quiz.size) {
    const quizzes = await MengerjakanKuis.find({
      _id: { $in: [...idsByType.quiz] },
      user_id: userId,
    })
      .select("_id soal.soal_id")
      .lean();
    for (const quiz of quizzes) {
      owned.quiz.set(
        quiz._id.toString(),
        new Set(quiz.soal.map((item) => item.soal_id.toString())),
      );
    }
  }
  if (idsByType.pretest.size) {
    const ids = [...idsByType.pretest];
    const [active, cancelled] = await Promise.all([
      MengerjakanPretest.find({ _id: { $in: ids }, user_id: userId })
        .select("_id")
        .lean(),
      PretestDibatalkan.find({ pretest_id: { $in: ids }, user_id: userId })
        .select("pretest_id")
        .lean(),
    ]);
    for (const pretest of active) owned.pretest.set(pretest._id.toString(), null);
    for (const pretest of cancelled) {
      owned.pretest.set(pretest.pretest_id.toString(), null);
    }
  }
  return owned;
};

const checkOwnership = (event, owned) => {
  if (!event.assessment_attempt_id) return null;
  const questions = owned[event.assessment_type].get(event.assessment_attempt_id);
  if (questions === undefined) return "attempt_not_owned";
  const questionId = event.properties.question_id;
  if (questions && questionId && !questions.has(questionId)) {
    return "question_not_in_attempt";
  }
  return null;
};

/**
 * Hasil per event: accepted (baru tersimpan), duplicate (sudah ada; jangan kirim ulang),
 * rejected (tidak valid; jangan kirim ulang), retry (gagal tersimpan; kirim ulang
 * dengan event_id sama), dropped_disabled (analytics nonaktif; tidak disimpan).
 */
const ingestBrowserEvents = async (user, rawEvents) => {
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return { error: "events harus berupa array berisi minimal 1 event" };
  }
  if (rawEvents.length > MAX_BATCH) {
    return { error: `Maksimal ${MAX_BATCH} event per request` };
  }

  const eventIdOf = (raw) =>
    typeof raw?.event_id === "string" && raw.event_id.length <= 64
      ? raw.event_id
      : null;

  const config = getConfig();
  if (!config.enabled) {
    return {
      results: rawEvents.map((raw) => ({
        event_id: eventIdOf(raw),
        status: "dropped_disabled",
      })),
    };
  }

  const now = new Date();
  const results = rawEvents.map((raw) => ({ event_id: eventIdOf(raw) }));
  const validated = rawEvents.map((raw) => validateBrowserEvent(raw, now));

  const seenIds = new Set();
  validated.forEach((item) => {
    if (item.reason) return;
    if (seenIds.has(item.event.event_id)) item.reason = "duplicate_in_batch";
    seenIds.add(item.event.event_id);
  });

  const valid = validated.filter((item) => !item.reason).map((item) => item.event);
  const owned = await loadOwnedAttempts(user.id, valid);
  for (const item of validated) {
    if (!item.reason) item.reason = checkOwnership(item.event, owned);
  }

  const toStore = [];
  validated.forEach((item, index) => {
    if (item.reason) {
      results[index].status = "rejected";
      results[index].reason = item.reason;
    } else {
      toStore.push({ index, event: item.event });
    }
  });

  if (toStore.length === 0) return { results };

  const envelope = buildEnvelope({
    config,
    analyticsUserId: await getAnalyticsUserId(user.id),
    cohort: getCohort(user.email, config),
    now,
  });

  const operations = toStore.map(({ event }) => {
    const schema = BROWSER_EVENTS[event.event_name];
    const sequenceValue = event.properties.sequence;
    const document = {
      ...envelope,
      ...event,
      event_source: "browser",
      committed_at: null,
      request_id: null,
      assessment_item_id:
        event.assessment_attempt_id && Number.isInteger(sequenceValue)
          ? `${event.assessment_attempt_id}:${sequenceValue}`
          : null,
      business_key: schema.businessKey
        ? schema.businessKey(event, event.assessment_attempt_id)
        : null,
    };
    const filter = document.business_key
      ? { business_key: document.business_key }
      : { analytics_user_id: document.analytics_user_id, event_id: document.event_id };

    return {
      updateOne: { filter, update: { $setOnInsert: document }, upsert: true },
    };
  });

  let bulkResult;
  let writeErrors = [];
  try {
    bulkResult = await AnalyticsEvent.collection.bulkWrite(operations, {
      ordered: false,
    });
  } catch (error) {
    if (!error.writeErrors && !error.result) throw error;
    bulkResult = error.result;
    writeErrors = [].concat(error.writeErrors ?? []);
  }

  const upserted = new Set(
    Object.keys(bulkResult?.upsertedIds ?? {}).map(Number),
  );
  const failed = new Map(writeErrors.map((writeError) => [writeError.index, writeError]));

  toStore.forEach(({ index }, operationIndex) => {
    const writeError = failed.get(operationIndex);
    if (!writeError) {
      results[index].status = upserted.has(operationIndex) ? "accepted" : "duplicate";
    } else if (writeError.code === 11000) {
      // event_id sama dengan event lain milik user yang sama.
      results[index].status = "duplicate";
    } else {
      // Tidak tersimpan: client boleh mengirim ulang dengan event_id yang sama.
      results[index].status = "retry";
    }
  });

  return { results };
};

module.exports = { ingestBrowserEvents };
