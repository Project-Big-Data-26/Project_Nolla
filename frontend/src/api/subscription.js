import API from "./axios";

// Kontrak backend: docs/perbaikan-frontend.md (FE-08).
const PLAN_ERROR_CODES = new Set(["PREMIUM_REQUIRED", "QUIZ_LIMIT_REACHED"]);

// 403 karena paket (bukan 403 lama "pretest belum selesai" yang tanpa code).
export const getPlanBlock = (error) => {
  const body = error?.response?.data;
  if (error?.response?.status !== 403 || !PLAN_ERROR_CODES.has(body?.code)) {
    return null;
  }
  return {
    code: body.code,
    message: body.message || "",
    used: body.data?.used ?? null,
    limit: body.data?.limit ?? null,
  };
};

export const fetchEntitlement = async () =>
  (await API.get("/subscription/me")).data.data;

// Harga dihitung server (env backend); frontend hanya menampilkan.
export const fetchPlans = async () =>
  (await API.get("/subscription/plans")).data.data;

export const startPlanCheckout = async (packageCode) =>
  (await API.post("/subscription/payments/checkout", { package: packageCode })).data.data;

export const fetchPayment = async (orderId) =>
  (await API.get(`/subscription/payments/${encodeURIComponent(orderId)}`)).data.data;

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// "Rp15.000" (tanpa spasi agar ringkas di daftar harga).
export const formatRupiah = (value) =>
  rupiahFormatter.format(value).replace(/\s/g, "");

export const formatDiscount = (discount) => {
  if (!discount) return null;
  return discount.type === "percentage"
    ? `Hemat ${String(discount.value).replace(".", ",")}%`
    : `Hemat ${formatRupiah(discount.amount)}`;
};

// 201 = dimulai, 200 = sudah berjalan; 409 dikembalikan sebagai hasil, bukan error.
export const activateTrial = async () => {
  try {
    const response = await API.post("/subscription/trial");
    return { ok: true, entitlement: response.data.data };
  } catch (error) {
    if (error.response?.status === 409) {
      return {
        ok: false,
        code: error.response.data?.code ?? null,
        message: error.response.data?.message || "Trial tidak dapat dimulai.",
      };
    }
    throw error;
  }
};

// used bisa melebihi limit bila user sempat trial.
export const remainingQuizSessions = (subbab) =>
  subbab?.quiz_sessions_limit == null
    ? null
    : Math.max(0, subbab.quiz_sessions_limit - (subbab.quiz_sessions_used ?? 0));

export const formatTimeLeft = (until, now = Date.now()) => {
  const ms = new Date(until).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) {
    const rest = hours % 24;
    return `${Math.floor(hours / 24)} hari${rest ? ` ${rest} jam` : ""}`;
  }
  if (hours >= 1) return `${hours} jam`;
  return `${Math.max(1, Math.ceil(ms / 60_000))} menit`;
};
