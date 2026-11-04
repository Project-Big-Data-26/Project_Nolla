import React, { useEffect, useRef, useState } from "react";
import { formatDiscount, formatRupiah } from "../api/subscription";
import mathGeometry from "../assets/komponenTambahan3.webp";
import mathCalculus from "../assets/komponenTambahan6.webp";

const FadeInSection = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    const element = domRef.current;
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      className={`transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
};

const PremiumPackagesSection = ({
  planCatalog,
  checkoutPlan,
  checkoutError,
  checkoutNotice,
  isAuthenticated,
  entitlement,
  onCheckout,
}) => (
  <section id="paket" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-white py-16 sm:py-20 lg:py-24">
    <img src={mathGeometry} alt="" aria-hidden="true" className="pointer-events-none absolute left-3 top-8 h-auto w-12 opacity-15 sm:left-10 sm:w-16" />
    <img src={mathCalculus} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-8 right-3 h-auto w-16 opacity-15 sm:right-10 sm:w-24" />

    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
      <FadeInSection className="mb-8 text-center sm:mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ff8a1f] sm:text-sm">Pilihan paket</p>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#1b1f3b] sm:text-3xl lg:text-4xl">Pilih masa Premium yang cocok</h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#5b6088] sm:text-base">
          Dapatkan lebih banyak kesempatan berlatih dan lanjutkan drill matematika sesuai ritmemu.
        </p>
      </FadeInSection>

      {planCatalog.status === "loading" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-5">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-5 h-4 w-28 rounded bg-slate-100" />
              <div className="mb-3 h-8 w-40 rounded bg-slate-100" />
              <div className="mb-8 h-4 w-24 rounded bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : planCatalog.status === "error" ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
          Paket Premium belum dapat dimuat. Silakan coba kembali nanti.
        </div>
      ) : planCatalog.data?.plans?.length ? (
        <>
          {entitlement?.package && (
            <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Paket Premium <strong>{entitlement.package}</strong> masih aktif hingga {entitlement.active_until ? new Date(entitlement.active_until).toLocaleDateString("id-ID") : "masa aktif berakhir"}. Pembelian paket baru tersedia setelah masa aktif berakhir.
            </div>
          )}
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 sm:gap-5">
            {planCatalog.data.plans.map((plan) => {
              const durationLabel = plan.code === "weekly" ? "1 minggu" : plan.code === "monthly" ? "1 bulan" : plan.code === "yearly" ? "1 tahun" : `${plan.duration_days} hari`;
              const discountLabel = formatDiscount(plan.discount);
              const isFeatured = plan.code === "yearly" && Boolean(plan.discount);

              return (
                <article key={plan.code} className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm transition-all sm:p-6 ${isFeatured ? "border-[#ff8a1f] ring-2 ring-[#ff8a1f]/15 md:-translate-y-1 md:shadow-lg" : "border-[#e3e6f8] hover:-translate-y-1 hover:shadow-lg"}`}>
                  {isFeatured && (
                    <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-[#ff8a1f] to-[#ff5d5d] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm sm:left-6">
                      Hemat lebih banyak
                    </span>
                  )}

                  <div className="mb-5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-[#1b1f3b] sm:text-lg">{plan.name}</h3>
                      {discountLabel && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:text-xs">{discountLabel}</span>}
                    </div>
                    <p className="text-xs text-[#5b6088] sm:text-sm">Masa aktif {durationLabel}</p>
                  </div>

                  <div className="mb-5 border-b border-slate-100 pb-5">
                    {plan.discount && <p className="mb-0.5 text-sm text-slate-400 line-through">{formatRupiah(plan.price)}</p>}
                    <p className="text-3xl font-bold tracking-tight text-[#1b1f3b] sm:text-4xl">{formatRupiah(plan.final_price)}</p>
                    <p className="mt-1 text-xs text-[#5b6088]">untuk {durationLabel}</p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="mt-1 text-emerald-500">✓</span><span>Akses Premium selama {durationLabel}</span></li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="mt-1 text-emerald-500">✓</span><span>Sesi kuis tanpa batas per subbab</span></li>
                  </ul>

                  {planCatalog.data.purchasable ? (
                    <button type="button" onClick={() => onCheckout(plan.code)} disabled={Boolean(checkoutPlan) || Boolean(entitlement?.package)} className="inline-flex w-full items-center justify-center rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                      {entitlement?.package ? "Paket sedang aktif" : checkoutPlan === plan.code ? checkoutNotice ? "Menunggu konfirmasi..." : "Menyiapkan pembayaran..." : isAuthenticated ? "Beli paket" : "Masuk untuk membeli"}
                    </button>
                  ) : (
                    <button type="button" disabled className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">Pembelian segera tersedia</button>
                  )}
                </article>
              );
            })}
          </div>
          {checkoutError && <p role="alert" className="mt-4 text-center text-sm text-red-600">{checkoutError}</p>}
          {checkoutNotice && <p role="status" className="mt-4 text-center text-sm text-emerald-700">{checkoutNotice}</p>}
          {!planCatalog.data.purchasable && <p className="mt-5 text-center text-xs text-slate-500 sm:text-sm">Paket dapat dilihat sekarang; pembelian belum tersedia.</p>}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">Paket Premium sedang tidak tersedia.</div>
      )}
    </div>
  </section>
);

export default PremiumPackagesSection;
