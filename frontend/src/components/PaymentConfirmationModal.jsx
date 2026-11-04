import React, { useEffect } from "react";
import { Check, CreditCard, LockKeyhole, X } from "lucide-react";
import { formatDiscount, formatRupiah } from "../api/subscription";

const getDuration = (plan) => {
  if (plan.code === "weekly") return "1 minggu";
  if (plan.code === "monthly") return "1 bulan";
  if (plan.code === "yearly") return "1 tahun";
  return `${plan.duration_days} hari`;
};

const PaymentConfirmationModal = ({
  plan,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!plan) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [plan, loading, onCancel]);

  if (!plan) return null;
  const duration = getDuration(plan);
  const discountLabel = formatDiscount(plan.discount);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#111827]/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-confirmation-title"
        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
              Konfirmasi pembelian
            </p>
            <h2
              id="payment-confirmation-title"
              className="text-lg font-bold text-[#1b1f3b] sm:text-xl"
            >
              Lanjutkan ke pembayaran?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f2f6ff] p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563eb] shadow-sm">
              <CreditCard aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-[#1b1f3b]">{plan.name}</p>
              <p className="text-sm text-slate-600">Masa aktif {duration}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            {plan.discount && (
              <div className="flex items-center justify-between gap-4 text-slate-500">
                <dt>Harga normal</dt>
                <dd className="line-through">{formatRupiah(plan.price)}</dd>
              </div>
            )}
            {discountLabel && (
              <div className="flex items-center justify-between gap-4 text-emerald-700">
                <dt>Diskon</dt>
                <dd className="font-semibold">{discountLabel}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 text-[#1b1f3b]">
              <dt className="font-semibold">Total pembayaran</dt>
              <dd className="text-lg font-bold">
                {formatRupiah(plan.final_price)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                "Menyiapkan..."
              ) : (
                <>
                  <Check aria-hidden="true" className="h-4 w-4" /> Lanjut bayar
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentConfirmationModal;
