const MAX_RESPONSE_TIME_MS = 24 * 60 * 60 * 1000;
const MAX_DURATION_SECONDS = 24 * 60 * 60;
const TIMING_METHODS = ["client_visible_v1"];

const invalid = (message) => ({ error: message });

// null/undefined berarti tidak diketahui dan tetap disimpan null, bukan 0.
const parseOptionalNonNegative = (value, field, max) => {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return invalid(`${field} harus berupa angka >= 0 atau null`);
  }
  if (value > max) return invalid(`${field} melebihi batas ${max}`);
  return { value };
};

const parseResponseTimeMs = (value) => {
  const result = parseOptionalNonNegative(
    value,
    "response_time_ms",
    MAX_RESPONSE_TIME_MS,
  );
  if (result.error || result.value === null) return result;
  if (!Number.isInteger(result.value)) {
    return invalid("response_time_ms harus bilangan bulat milidetik");
  }
  return result;
};

const parseLegacyResponseTimeSeconds = (value) =>
  parseOptionalNonNegative(value, "response_time", MAX_DURATION_SECONDS);

const parseDurationSeconds = (value) =>
  parseOptionalNonNegative(value, "duration", MAX_DURATION_SECONDS);

const parseOptionalBoolean = (value, field) => {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== "boolean") return invalid(`${field} harus boolean`);
  return { value };
};

const parseTimingMethod = (value) => {
  if (value === undefined || value === null) return { value: null };
  if (!TIMING_METHODS.includes(value)) {
    return invalid(`timing_method harus salah satu dari: ${TIMING_METHODS.join(", ")}`);
  }
  return { value };
};

// Mengembalikan { value: { response_time, response_time_ms, response_time_partial } } atau { error }.
const parseAnswerTiming = (answer) => {
  const legacy = parseLegacyResponseTimeSeconds(answer?.response_time);
  if (legacy.error) return legacy;
  const ms = parseResponseTimeMs(answer?.response_time_ms);
  if (ms.error) return ms;
  const partial = parseOptionalBoolean(
    answer?.response_time_partial,
    "response_time_partial",
  );
  if (partial.error) return partial;

  return {
    value: {
      response_time: legacy.value,
      response_time_ms: ms.value,
      response_time_partial: partial.value,
    },
  };
};

module.exports = {
  TIMING_METHODS,
  parseAnswerTiming,
  parseDurationSeconds,
  parseTimingMethod,
};
