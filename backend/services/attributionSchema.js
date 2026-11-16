const VISIT_ID_PATTERN = /^vst_[0-9a-f]{48}$/;
const SOURCE_MEDIUMS = {
  whatsapp: ["broadcast"],
  instagram: ["story", "feed"],
  tiktok: ["story", "post"],
  school_visit: ["poster_qr"],
};
const SOURCES = [...Object.keys(SOURCE_MEDIUMS), "direct", "unknown"];
const MEDIUMS = [
  ...new Set(Object.values(SOURCE_MEDIUMS).flat()),
  "none",
];
const CONTENTS = ["poster", "video"];
const CAMPAIGNS = ["promosi_nolla"];
const PLACEMENT_ID_PATTERN =
  /^(?=.{1,64}$)[a-z0-9]+(?:_[a-z0-9]+){1,5}$/;
const ALLOWED_FIELDS = new Set([
  "visit_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "placement_id",
  "has_referrer",
]);

const readPlacements = () => {
  const raw = process.env.ATTRIBUTION_PLACEMENTS_JSON;
  if (!raw) return {};

  let placements;
  try {
    placements = JSON.parse(raw);
  } catch {
    throw new Error("ATTRIBUTION_PLACEMENTS_JSON harus berupa objek JSON");
  }
  if (!placements || typeof placements !== "object" || Array.isArray(placements)) {
    throw new Error("ATTRIBUTION_PLACEMENTS_JSON harus berupa objek kode ke nama sekolah");
  }

  for (const [code, name] of Object.entries(placements)) {
    if (
      !PLACEMENT_ID_PATTERN.test(code) ||
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 120
    ) {
      throw new Error("Daftar placement sekolah berisi kode atau nama yang tidak valid");
    }
  }
  return placements;
};

const parseAttribution = (raw, placements = readPlacements()) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "payload_invalid" };
  }
  if (Object.keys(raw).some((key) => !ALLOWED_FIELDS.has(key))) {
    return { error: "field_not_allowed" };
  }
  if (typeof raw.visit_id !== "string" || !VISIT_ID_PATTERN.test(raw.visit_id)) {
    return { error: "visit_id_invalid" };
  }
  if (typeof raw.has_referrer !== "boolean") {
    return { error: "has_referrer_invalid" };
  }

  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "placement_id",
  ];
  const hasUtm = utmKeys.some((key) => raw[key] !== undefined && raw[key] !== "");
  if (!hasUtm) {
    return {
      attribution: {
        visit_id: raw.visit_id,
        attribution_type: raw.has_referrer ? "unknown" : "direct",
        source: raw.has_referrer ? "unknown" : "direct",
        medium: "none",
        campaign: null,
        content: null,
        placement_id: null,
      },
    };
  }

  const source = raw.utm_source;
  const medium = raw.utm_medium;
  if (
    typeof source !== "string" ||
    !Object.prototype.hasOwnProperty.call(SOURCE_MEDIUMS, source) ||
    !SOURCE_MEDIUMS[source].includes(medium)
  ) {
    return { error: "utm_source_medium_invalid" };
  }

  const campaign = raw.utm_campaign ?? null;
  if (
    campaign !== null &&
    (typeof campaign !== "string" || !CAMPAIGNS.includes(campaign))
  ) {
    return { error: "utm_campaign_invalid" };
  }

  const content = raw.utm_content ?? null;
  if (content !== null && !CONTENTS.includes(content)) {
    return { error: "utm_content_invalid" };
  }

  const placementId = raw.placement_id ?? null;
  if (source === "school_visit") {
    if (
      campaign !== "promosi_nolla" ||
      content !== "poster" ||
      typeof placementId !== "string" ||
      !PLACEMENT_ID_PATTERN.test(placementId) ||
      !Object.prototype.hasOwnProperty.call(placements, placementId)
    ) {
      return { error: "placement_id_invalid" };
    }
  } else if (placementId !== null) {
    return { error: "placement_id_invalid" };
  }

  return {
    attribution: {
      visit_id: raw.visit_id,
      attribution_type: "utm",
      source,
      medium,
      campaign,
      content,
      placement_id: placementId,
    },
  };
};

module.exports = {
  CAMPAIGNS,
  CONTENTS,
  MEDIUMS,
  PLACEMENT_ID_PATTERN,
  SOURCES,
  VISIT_ID_PATTERN,
  parseAttribution,
  readPlacements,
};
