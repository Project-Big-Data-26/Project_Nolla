import React, { useEffect } from "react";
import { BadgeCheck, BookOpen, X } from "lucide-react";

const PaymentSuccessModal = ({ plan, onClose, onGoToTopics }) => {
  useEffect(() => {
    if (!plan) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [plan, onClose]);

  if (!plan) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-y-auto bg-[#111827]/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex justify-end px-4 pt-4">
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-7 text-center sm:px-8 sm:pb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <BadgeCheck aria-hidden="true" className="h-10 w-10" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">Transaksi berhasil</p>
          <h2 id="payment-success-title" className="text-xl font-bold text-[#1b1f3b] sm:text-2xl">Pembayaran berhasil!</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            Pembayaran <span className="font-semibold text-[#1b1f3b]">{plan.name}</span> berhasil dan akses Premium sudah terhubung ke akunmu.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Tutup
            </button>
            <button type="button" onClick={onGoToTopics} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              <BookOpen aria-hidden="true" className="h-4 w-4" />
              Buka topik belajar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentSuccessModal;
