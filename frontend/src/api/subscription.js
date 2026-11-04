import API from "./axios";

// Kontrak backend: docs/perbaikan-frontend.md (FE-08).
const PLAN_ERROR_CODES = new Set(["PREMIUM_REQUIRED", "QUIZ_LIMIT_REACHED"]);
const PREMIUM_ACTIVATION_NOTICE_KEY = "nolla:premium-activation-notice";

export const markPremiumActivationNotice = () => {
  try {
    window.sessionStorage.setItem(PREMIUM_ACTIVATION_NOTICE_KEY, "1");
  } catch {
    // Payment success flow must not depend on browser storage availability.
  }
};

export const consumePremiumActivationNotice = () => {
  try {
    const shouldShow = window.sessionStorage.getItem(PREMIUM_ACTIVATION_NOTICE_KEY) === "1";
    if (shouldShow) window.sessionStorage.removeItem(PREMIUM_ACTIVATION_NOTICE_KEY);
    return shouldShow;
  } catch {
    return false;
  }
};

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

// Pantau transaksi tertunda agar UI berpindah sendiri ketika webhook Midtrans
// sudah memperbarui status pembayaran di backend.
export const watchPaymentStatus = (
  orderId,
  {
    onPaid,
    onTerminal,
    onTimeout,
    intervalMs = 2000,
    fastIntervalMs = 500,
    fastAttempts = 12,
    maxAttempts = 90,
  },
) => {
  let stopped = false;
  let attempts = 0;
  let timer;

  const stop = () => {
    stopped = true;
    window.clearTimeout(timer);
  };

  const poll = async () => {
    if (stopped) return;
    attempts += 1;
    try {
      const payment = await fetchPayment(orderId);
      if (stopped) return;
      if (payment.status === "paid") {
        stop();
        onPaid?.(payment);
        return;
      }
      if (["failed", "expired", "cancelled", "refunded"].includes(payment.status)) {
        stop();
        onTerminal?.(payment);
        return;
      }
    } catch {
      // Lanjutkan polling jika endpoint sementara tidak dapat dijangkau.
    }

    if (stopped) return;
    if (attempts >= maxAttempts) {
      stop();
      onTimeout?.();
      return;
    }
    const nextInterval = attempts <= fastAttempts ? fastIntervalMs : intervalMs;
    timer = window.setTimeout(poll, nextInterval);
  };

  void poll();
  return stop;
};

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
