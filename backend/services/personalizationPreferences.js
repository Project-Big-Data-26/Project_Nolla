const mongoose = require("mongoose");
const Jenjang = require("../models/Jenjang");
const { contextFromRequest, recordServerEvents } = require("./analyticsService");

const LEVEL_NAMES = new Set(["SD", "SMP", "SMA"]);

// Nama jenjang harus cocok eksak; input request tidak digunakan sebagai regex.
const resolveJenjang = async (value) => {
  if (typeof value !== "string" || value.length > 32 || !value.trim()) return null;
  const normalized = value.trim();
  if (mongoose.Types.ObjectId.isValid(normalized)) {
    const jenjang = await Jenjang.findById(normalized);
    return jenjang && LEVEL_NAMES.has(jenjang.name) ? jenjang : null;
  }
  const name = normalized.toUpperCase();
  return LEVEL_NAMES.has(name) ? Jenjang.findOne({ name }) : null;
};

// Salin hanya preferensi sebelum document Mongoose dimutasi/disimpan.
const snapshotPreference = (user) => {
  const allJenjang = user.allJenjang === true;
  const id = user.jenjang_id?._id ?? user.jenjang_id;
  return {
    allJenjang,
    jenjangId: allJenjang || id == null ? null : String(id),
  };
};

const preferenceChanged = (before, user) => {
  const after = snapshotPreference(user);
  return before.allJenjang !== after.allJenjang || before.jenjangId !== after.jenjangId;
};

const recordPersonalizationSaved = (req, { selectedJenjang, allJenjang, entryContext }) =>
  recordServerEvents(contextFromRequest(req), [
    {
      name: "personalization_saved",
      properties: {
        selected_jenjang: allJenjang ? null : selectedJenjang,
        all_jenjang: allJenjang,
        entry_context: entryContext,
      },
    },
  ]);

module.exports = {
  resolveJenjang,
  snapshotPreference,
  preferenceChanged,
  recordPersonalizationSaved,
};
