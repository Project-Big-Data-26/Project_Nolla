import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPlans, formatDiscount, formatRupiah, startPlanCheckout } from "../api/subscription";
import { openSnapCheckout } from "../api/midtransSnap";

/**
 * Daftar paket Premium dari GET /subscription/plans (harga dari env backend).
 * Ditampilkan di konteks konten terkunci; transaksi dibuat oleh backend.
 */
const PlanCatalog = () => {
  const [state, setState] = useState({ status: "loading", data: null });
  const [checkoutCode, setCheckoutCode] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const buyPlan = async (code) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setCheckoutCode(code);
    setCheckoutError("");
    setCheckoutNotice("");
    try {
      const checkout = await startPlanCheckout(code);
      await openSnapCheckout(checkout, {
        onSuccess: () => {
          setCheckoutCode(null);
          setCheckoutNotice("Pembayaran diterima. Status Premium akan diperbarui setelah verifikasi Midtrans.");
        },
        onPending: () => {
          setCheckoutCode(null);
          setCheckoutNotice("Pembayaran menunggu konfirmasi. Status akan diperbarui otomatis setelah Midtrans mengirim notifikasi.");
        },
        onError: () => {
          setCheckoutCode(null);
          setCheckoutError("Pembayaran belum berhasil. Silakan coba lagi.");
        },
        onClose: () => setCheckoutCode(null),
      });
    } catch (error) {
      setCheckoutError(error.response?.data?.message || "Checkout gagal dibuat. Silakan coba lagi.");
      setCheckoutCode(null);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    fetchPlans()
      .then((data) => {
        if (isCurrent) setState({ status: "ready", data });
      })
      .catch(() => {
        if (isCurrent) setState({ status: "error", data: null });
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  if (state.status === "loading") {
    return <p className="text-xs text-slate-400">Memuat daftar paket...</p>;
  }
  if (state.status === "error") {
    return <p className="text-xs text-slate-500">Daftar paket gagal dimuat.</p>;
  }

  const plans = state.data?.plans || [];
  if (plans.length === 0) return null;

  // Container query: kartu baris ringkas di wadah sempit (ponsel, panel soal),
  // 3 kolom berdampingan bila wadah cukup lebar (modal di tablet/desktop).
  return (
    <div className="@container w-full">
      <ul className="grid grid-cols-1 gap-2 @xl:grid-cols-3 @xl:gap-3">
        {plans.map((plan) => {
          const discountLabel = formatDiscount(plan.discount);
          const isLoading = plan.code === checkoutCode;
          return (
            <li key={plan.code}>
              <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 @xl:gap-4 @xl:p-5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 @xl:text-base">
                    {plan.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {plan.duration_days} hari
                  </p>
                  {discountLabel && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {discountLabel}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-end justify-between gap-3 @xl:items-start @xl:flex-col">
                  <div className="text-right @xl:text-left">
                  {plan.discount && (
                    <p className="text-xs text-slate-400 line-through">
                      {formatRupiah(plan.price)}
                    </p>
                  )}
                  <p className="text-base font-bold text-slate-900 tabular-nums @xl:text-xl">
                    {formatRupiah(plan.final_price)}
                  </p>
                  </div>
                  {state.data.purchasable && (
                    <button
                      type="button"
                      onClick={() => buyPlan(plan.code)}
                      disabled={Boolean(checkoutCode)}
                      className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isLoading ? "Memproses..." : isAuthenticated ? "Beli paket" : "Masuk untuk membeli"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!state.data.purchasable && (
        <p className="mt-3 text-xs text-slate-500">
          Pembelian paket segera tersedia.
        </p>
      )}
      {checkoutError && <p role="alert" className="mt-3 text-xs text-red-600">{checkoutError}</p>}
      {checkoutNotice && <p role="status" className="mt-3 text-xs text-emerald-700">{checkoutNotice}</p>}
    </div>
  );
};

export default PlanCatalog;
