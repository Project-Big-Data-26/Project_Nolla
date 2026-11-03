import React, { useEffect, useState } from "react";
import { fetchPlans, formatDiscount, formatRupiah } from "../api/subscription";

/**
 * Daftar paket Premium dari GET /subscription/plans (harga dari env backend).
 * Hanya ditampilkan di konteks konten terkunci. Selama payment gateway belum
 * ada (purchasable=false), hanya catatan "segera tersedia".
 */
const PlanCatalog = () => {
  const [state, setState] = useState({ status: "loading", data: null });
  // Pilihan hanya tampilan; dipakai checkout saat payment gateway tersedia.
  const [selectedCode, setSelectedCode] = useState(null);

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
          const isSelected = plan.code === selectedCode;
          return (
            <li key={plan.code}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCode(plan.code)}
                className={`flex h-full w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.99] @xl:flex-col @xl:items-start @xl:justify-between @xl:gap-4 @xl:p-5 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
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
                <div className="shrink-0 text-right @xl:text-left">
                  {plan.discount && (
                    <p className="text-xs text-slate-400 line-through">
                      {formatRupiah(plan.price)}
                    </p>
                  )}
                  <p className="text-base font-bold text-slate-900 tabular-nums @xl:text-xl">
                    {formatRupiah(plan.final_price)}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {!state.data.purchasable && (
        <p className="mt-3 text-xs text-slate-500">
          Pembelian paket segera tersedia.
        </p>
      )}
    </div>
  );
};

export default PlanCatalog;
