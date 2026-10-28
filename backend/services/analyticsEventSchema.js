// Skema dan validasi event browser (tanpa akses database).
const { CLIENT_ID_PATTERN } = require("../middleware/requestContext");

const SCHEMA_VERSION = 1;
const MAX_BATCH = 50;
const MAX_PAST_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_MS = 5 * 60 * 1000;
const CLOCK_SKEW_MS = 2 * 60 * 1000;
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTE_PATTERN = /^[a-z][a-z0-9_]{0,47}$/;
const QUALITY_FLAGS = [
  "clock_skew",
  "partial_timing",
  "offline_replay",
  "asset_load_failed",
  "multiple_tabs",
];

// Tipe properti: semua string dibatasi pola/enum sehingga teks bebas,
// URL, token, atau email tidak dapat masuk ke penyimpanan.
const t = {
  objectId: { kind: "objectId" },
  clientId: { kind: "clientId" },
  slug: { kind: "slug" },
  bool: { kind: "bool" },
  int: (min, max) => ({ kind: "int", min, max }),
  number: (min, max) => ({ kind: "number", min, max }),
  oneOf: (...values) => ({ kind: "enum", values }),
};
const req = (type) => ({ ...type, required: true });
const nullable = (type) => ({ ...type, nullable: true });
const durationMs = t.int(0, MAX_DURATION_MS);
const sequence = t.int(1, 200);

// attempt: "required" | "optional" | "none"
const BROWSER_EVENTS = {
  page_viewed: {
    attempt: "optional",
    route: true,
    properties: { content_state: t.oneOf("ready", "empty", "error") },
  },
  question_viewed: {
    attempt: "required",
    properties: {
      question_id: req(t.objectId),
      sequence: req(sequence),
      view_id: req(t.clientId),
      is_revisit: t.bool,
      assets_ready: t.bool,
    },
  },
  question_timing_recorded: {
    attempt: "required",
    properties: {
      question_id: req(t.objectId),
      sequence: req(sequence),
      view_id: req(t.clientId),
      interval_seq: req(t.int(1, 10000)),
      visible_time_ms: req(durationMs),
      active_time_ms: nullable(durationMs),
      wall_time_ms: nullable(durationMs),
      timing_method: req(t.oneOf("client_visible_v1")),
    },
    // Retry interval yang sama tidak boleh menambah durasi dua kali.
    businessKey: (event, attemptId) =>
      `question_timing_recorded:${attemptId}:${event.properties.view_id}:${event.properties.interval_seq}`,
  },
  assessment_exit_requested: {
    attempt: "required",
    properties: { sequence: nullable(sequence) },
  },
  question_asset_failed: {
    attempt: "optional",
    properties: {
      question_id: req(t.objectId),
      asset_type: req(t.oneOf("image")),
      failure_code: req(t.oneOf("load_error", "timeout", "decode_error")),
    },
  },
  review_viewed: {
    attempt: "required",
    properties: {
      mode: req(t.oneOf("summary", "per_question")),
      question_id: t.objectId,
      sequence,
    },
  },
  application_error: {
    attempt: "optional",
    route: true,
    properties: {
      operation: req(t.slug),
      reason_code: req(t.slug),
      http_status: nullable(t.int(0, 599)),
      retriable: t.bool,
    },
  },
  answer_selection_changed: {
    attempt: "required",
    properties: {
      question_id: req(t.objectId),
      sequence: req(sequence),
      revision_number: req(t.int(0, 1000)),
      is_revision: req(t.bool),
    },
  },
  question_navigated: {
    attempt: "required",
    properties: {
      from_sequence: req(sequence),
      to_sequence: req(sequence),
      method: req(t.oneOf("next", "previous", "jump")),
      from_unanswered: t.bool,
    },
  },
  topic_selected: {
    attempt: "none",
    properties: {
      bab_id: req(t.objectId),
      subbab_id: t.objectId,
      location: t.slug,
    },
  },
  topic_search_performed: {
    attempt: "none",
    properties: {
      query_length_bucket: req(t.oneOf("1-3", "4-10", "11+")),
      result_count: req(t.int(0, 10000)),
    },
  },
  topic_filter_changed: {
    attempt: "none",
    properties: {
      filter_name: req(t.oneOf("jenjang", "kelas", "progress")),
      filter_value: req(t.slug),
      result_count: t.int(0, 10000),
    },
  },
  web_vital_recorded: {
    attempt: "none",
    route: true,
    properties: {
      metric_name: req(t.oneOf("LCP", "INP", "CLS", "FCP", "TTFB")),
      metric_id: req(t.clientId),
      value: req(t.number(0, 600000)),
      device_category: t.oneOf("mobile", "tablet", "desktop"),
      sampling_rate: t.number(0, 1),
    },
  },
};

const ENVELOPE_KEYS = new Set([
  "event_id",
  "event_name",
  "schema_version",
  "occurred_at",
  "learning_session_id",
  "page_instance_id",
  "assessment_type",
  "assessment_attempt_id",
  "route_name",
  "quality_flags",
  "properties",
]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const checkValue = (value, type) => {
  switch (type.kind) {
    case "objectId":
      return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
    case "clientId":
      return typeof value === "string" && CLIENT_ID_PATTERN.test(value);
    case "slug":
      return typeof value === "string" && ROUTE_PATTERN.test(value);
    case "bool":
      return typeof value === "boolean";
    case "int":
      return Number.isInteger(value) && value >= type.min && value <= type.max;
    case "number":
      return typeof value === "number" && Number.isFinite(value) && value >= type.min && value <= type.max;
    case "enum":
      return type.values.includes(value);
    default:
      return false;
  }
};

const validateProperties = (properties, schema) => {
  if (properties === undefined) properties = {};
  if (!isPlainObject(properties)) return "properties_invalid";

  for (const key of Object.keys(properties)) {
    if (!schema[key]) return `property_not_allowed:${key}`;
  }
  for (const [key, type] of Object.entries(schema)) {
    const value = properties[key];
    if (value === undefined || value === null) {
      if (type.required) return `property_required:${key}`;
      if (value === null && !type.nullable) return `property_invalid:${key}`;
      continue;
    }
    if (!checkValue(value, type)) return `property_invalid:${key}`;
  }
  return null;
};

// Mengembalikan { event } yang sudah dinormalisasi atau { reason } penolakan.
const validateBrowserEvent = (raw, now) => {
  if (!isPlainObject(raw)) return { reason: "event_invalid" };

  for (const key of Object.keys(raw)) {
    if (!ENVELOPE_KEYS.has(key)) return { reason: `field_not_allowed:${key}` };
  }
  if (typeof raw.event_id !== "string" || !UUID_PATTERN.test(raw.event_id)) {
    return { reason: "event_id_invalid" };
  }

  const schema = BROWSER_EVENTS[raw.event_name];
  if (!schema) return { reason: "event_name_not_allowed" };
  if (raw.schema_version !== SCHEMA_VERSION) {
    return { reason: "schema_version_unsupported" };
  }

  const occurredAt =
    typeof raw.occurred_at === "string" ? new Date(raw.occurred_at) : null;
  if (!occurredAt || Number.isNaN(occurredAt.getTime())) {
    return { reason: "occurred_at_invalid" };
  }
  const skew = occurredAt.getTime() - now.getTime();
  if (skew > MAX_FUTURE_MS || -skew > MAX_PAST_MS) {
    return { reason: "occurred_at_out_of_range" };
  }

  for (const key of ["learning_session_id", "page_instance_id"]) {
    if (!checkValue(raw[key], t.clientId)) return { reason: `${key}_invalid` };
  }

  if (schema.route) {
    if (!checkValue(raw.route_name, t.slug)) return { reason: "route_name_invalid" };
  } else if (raw.route_name !== undefined) {
    return { reason: "field_not_allowed:route_name" };
  }

  const hasAttempt =
    raw.assessment_type !== undefined || raw.assessment_attempt_id !== undefined;
  if (hasAttempt) {
    if (schema.attempt === "none") {
      return { reason: "field_not_allowed:assessment_attempt_id" };
    }
    if (!["pretest", "quiz"].includes(raw.assessment_type)) {
      return { reason: "assessment_type_invalid" };
    }
    if (!checkValue(raw.assessment_attempt_id, t.objectId)) {
      return { reason: "assessment_attempt_id_invalid" };
    }
  } else if (schema.attempt === "required") {
    return { reason: "assessment_attempt_required" };
  }

  const flags = raw.quality_flags ?? [];
  if (
    !Array.isArray(flags) ||
    flags.length > QUALITY_FLAGS.length ||
    flags.some((flag) => !QUALITY_FLAGS.includes(flag))
  ) {
    return { reason: "quality_flags_invalid" };
  }

  const propertyError = validateProperties(raw.properties, schema.properties);
  if (propertyError) return { reason: propertyError };

  const qualityFlags = new Set(flags);
  if (Math.abs(skew) > CLOCK_SKEW_MS) qualityFlags.add("clock_skew");

  return {
    event: {
      event_id: raw.event_id.toLowerCase(),
      event_name: raw.event_name,
      occurred_at: occurredAt,
      learning_session_id: raw.learning_session_id,
      page_instance_id: raw.page_instance_id,
      assessment_type: hasAttempt ? raw.assessment_type : null,
      assessment_attempt_id: hasAttempt ? raw.assessment_attempt_id : null,
      route_name: schema.route ? raw.route_name : null,
      quality_flags: [...qualityFlags],
      properties: raw.properties ?? {},
    },
  };
};

module.exports = {
  BROWSER_EVENTS,
  MAX_BATCH,
  SCHEMA_VERSION,
  validateBrowserEvent,
};
