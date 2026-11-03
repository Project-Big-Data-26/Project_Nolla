// Katalog paket Premium dari env. Harga dihitung hanya di server.
// Env diisi tapi salah -> server gagal start (pesan menyebut nama variabel, tanpa nilai).
// PRICE kosong -> paket belum ditawarkan.

const PLAN_DEFINITIONS = [
  { code: "weekly", name: "Premium Mingguan", durationDays: 7, envPrefix: "PREMIUM_WEEKLY" },
  { code: "monthly", name: "Premium Bulanan", durationDays: 30, envPrefix: "PREMIUM_MONTHLY" },
  { code: "yearly", name: "Premium Tahunan", durationDays: 365, envPrefix: "PREMIUM_YEARLY" },
];
const DISCOUNT_TYPES = ["none", "flat", "percentage"];
const INTEGER_PATTERN = /^\d+$/;
const PERCENTAGE_PATTERN = /^\d+(\.\d{1,2})?$/;

class PlanConfigError extends Error {}

// Saklar fitur paket. Kosong = aktif; nilai tidak dikenal = gagal start.
const SWITCH_VALUES = { true: true, 1: true, on: true, false: false, 0: false, off: false };

const isPremiumFeatureEnabled = (env = process.env) => {
  const raw = env.PREMIUM_FEATURE_ENABLED;
  if (raw === undefined || String(raw).trim() === "") return true;
  const value = SWITCH_VALUES[String(raw).trim().toLowerCase()];
  if (value === undefined) {
    throw new PlanConfigError(
      "- PREMIUM_FEATURE_ENABLED harus salah satu dari: true, false, 1, 0, on, off",
    );
  }
  return value;
};

const isBlank = (value) => value === undefined || String(value).trim() === "";

// Fungsi murni: harga normal + diskon -> rincian harga (Rupiah bulat).
const computePrice = (price, discount) => {
  if (!discount || discount.type === "none") {
    return { price, discount: null, final_price: price };
  }
  const amount =
    discount.type === "flat"
      ? discount.value
      : Math.round((price * discount.value) / 100);
  return {
    price,
    discount: { type: discount.type, value: discount.value, amount },
    final_price: price - amount,
  };
};

// Mengembalikan null bila paket tidak dikonfigurasi; error berupa daftar pesan.
const parsePlanEnv = (env, definition) => {
  const priceName = `${definition.envPrefix}_PRICE`;
  const typeName = `${definition.envPrefix}_DISCOUNT_TYPE`;
  const valueName = `${definition.envPrefix}_DISCOUNT_VALUE`;
  const priceRaw = env[priceName];
  const typeRaw = env[typeName];
  const valueRaw = env[valueName];

  if (isBlank(priceRaw)) {
    if (!isBlank(typeRaw) || !isBlank(valueRaw)) {
      return { errors: [`${typeName}/${valueName} diisi tetapi ${priceName} kosong`] };
    }
    return { plan: null, errors: [] };
  }

  if (!INTEGER_PATTERN.test(priceRaw.trim()) || Number(priceRaw) <= 0) {
    return { errors: [`${priceName} harus bilangan bulat Rupiah lebih dari 0`] };
  }
  const price = Number(priceRaw);

  const type = isBlank(typeRaw) ? "none" : typeRaw.trim().toLowerCase();
  if (!DISCOUNT_TYPES.includes(type)) {
    return { errors: [`${typeName} harus salah satu dari: ${DISCOUNT_TYPES.join(", ")}`] };
  }

  let discount = null;
  if (type === "none") {
    if (!isBlank(valueRaw) && Number(valueRaw) !== 0) {
      return { errors: [`${valueName} harus kosong atau 0 bila ${typeName}=none`] };
    }
  } else if (isBlank(valueRaw)) {
    return { errors: [`${valueName} wajib diisi bila ${typeName}=${type}`] };
  } else if (type === "flat") {
    const value = valueRaw.trim();
    if (!INTEGER_PATTERN.test(value) || Number(value) <= 0 || Number(value) >= price) {
      return { errors: [`${valueName} (flat) harus bilangan bulat lebih dari 0 dan kurang dari ${priceName}`] };
    }
    discount = { type, value: Number(value) };
  } else {
    const value = valueRaw.trim();
    if (!PERCENTAGE_PATTERN.test(value) || Number(value) <= 0 || Number(value) >= 100) {
      return { errors: [`${valueName} (percentage) harus angka lebih dari 0 dan kurang dari 100 (maks. 2 desimal)`] };
    }
    discount = { type, value: Number(value) };
  }

  const pricing = computePrice(price, discount);
  if (pricing.final_price < 1) {
    return { errors: [`Harga akhir ${definition.envPrefix} setelah diskon kurang dari Rp1`] };
  }

  return {
    plan: {
      code: definition.code,
      name: definition.name,
      duration_days: definition.durationDays,
      ...pricing,
    },
    errors: [],
  };
};

// Semua kesalahan dikumpulkan agar diperbaiki sekaligus.
const loadPlanCatalog = (env = process.env) => {
  const plans = [];
  const errors = [];
  for (const definition of PLAN_DEFINITIONS) {
    const result = parsePlanEnv(env, definition);
    errors.push(...result.errors);
    if (result.plan) plans.push(result.plan);
  }
  if (errors.length > 0) {
    throw new PlanConfigError(errors.map((message) => `- ${message}`).join("\n"));
  }
  return plans;
};

let catalog = null;

// Dipanggil sekali saat backend start.
const initPlanCatalog = (env = process.env) => {
  catalog = loadPlanCatalog(env);
  return catalog;
};

const getPlanCatalog = () => {
  if (!catalog) catalog = loadPlanCatalog();
  return catalog;
};

const getPlanByCode = (code) =>
  getPlanCatalog().find((plan) => plan.code === code) ?? null;

module.exports = {
  PLAN_DEFINITIONS,
  PlanConfigError,
  computePrice,
  getPlanByCode,
  getPlanCatalog,
  initPlanCatalog,
  isPremiumFeatureEnabled,
  loadPlanCatalog,
};
