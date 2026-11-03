const Bab = require("../models/Bab");
const Langganan = require("../models/Langganan");

const FREE_QUIZ_SESSIONS_PER_SUBBAB = 3;
const TRIAL_DURATION_MS = 72 * 60 * 60 * 1000;

const isActivePeriod = (period, now) =>
  !period.cancelled_at &&
  new Date(period.starts_at) <= now &&
  now < new Date(period.ends_at);

// Hak akses dihitung dari periode tersimpan, bukan JWT, agar trial yang habis
// langsung kembali ke free tanpa cron.
const resolveEntitlement = (periods, now = new Date()) => {
  const active = periods.filter((period) => isActivePeriod(period, now));
  const trial = periods.find((period) => period.source === "trial") ?? null;
  const isPremium = active.length > 0;

  return {
    plan: isPremium ? "premium" : "free",
    is_trial: isPremium && active.every((period) => period.source === "trial"),
    active_until: isPremium
      ? new Date(Math.max(...active.map((period) => new Date(period.ends_at))))
      : null,
    trial: {
      // Trial yang dibatalkan tetap terhitung sudah dipakai.
      available: !trial,
      started_at: trial?.starts_at ?? null,
      ends_at: trial?.ends_at ?? null,
    },
    limits: {
      quiz_sessions_per_subbab: isPremium ? null : FREE_QUIZ_SESSIONS_PER_SUBBAB,
    },
  };
};

const getEntitlement = async (userId, now = new Date()) => {
  const periods = await Langganan.find({ user_id: userId })
    .select("source starts_at ends_at cancelled_at")
    .lean();
  return resolveEntitlement(periods, now);
};

// Bab terkunci untuk free: display_order terbesar di tiap kelas (semua bila seri).
// Bab tanpa display_order numerik diabaikan agar kelas tanpa urutan tidak terkunci seluruhnya.
const pickLockedBabIds = (babList) => {
  const maxOrderByKelas = new Map();
  for (const bab of babList) {
    if (!Number.isFinite(bab.display_order)) continue;
    const kelasId = bab.kelas_id.toString();
    const current = maxOrderByKelas.get(kelasId);
    if (current === undefined || bab.display_order > current) {
      maxOrderByKelas.set(kelasId, bab.display_order);
    }
  }

  return new Set(
    babList
      .filter(
        (bab) =>
          Number.isFinite(bab.display_order) &&
          bab.display_order === maxOrderByKelas.get(bab.kelas_id.toString()),
      )
      .map((bab) => bab._id.toString()),
  );
};

const getLockedBabIds = async (kelasIds) => {
  const babList = await Bab.find({ kelas_id: { $in: kelasIds } })
    .select("_id kelas_id display_order")
    .lean();
  return pickLockedBabIds(babList);
};

// bab wajib memuat _id dan kelas_id. Premium (termasuk trial) tidak pernah terkunci.
const isBabLocked = async (entitlement, bab) =>
  entitlement.plan === "free" &&
  (await getLockedBabIds([bab.kelas_id])).has(bab._id.toString());

// Event hambatan untuk analytics (tanpa dedup, seperti question_pool_insufficient).
const planLimitHitEvent = ({ reason, surface, entitlement, babId, subbabId = null, used = null }) => ({
  name: "plan_limit_hit",
  properties: {
    reason,
    surface,
    bab_id: String(babId),
    subbab_id: subbabId == null ? null : String(subbabId),
    sessions_used: used,
    trial_available: entitlement.trial.available,
  },
});

const PREMIUM_REQUIRED_MESSAGE =
  "Bab ini khusus premium. Aktifkan trial atau upgrade untuk membukanya.";

module.exports = {
  FREE_QUIZ_SESSIONS_PER_SUBBAB,
  PREMIUM_REQUIRED_MESSAGE,
  TRIAL_DURATION_MS,
  getEntitlement,
  getLockedBabIds,
  isBabLocked,
  pickLockedBabIds,
  planLimitHitEvent,
  resolveEntitlement,
};
