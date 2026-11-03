import React, { useEffect, useRef, useState } from "react";
import { formatTimeLeft } from "../api/subscription";
import crownIcon from "../assets/crown-icon.webp";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const PACKAGE_LABELS = {
  weekly: "Premium Mingguan",
  monthly: "Premium Bulanan",
  yearly: "Premium Tahunan",
};

/**
 * Status trial/Premium aktif di halaman topik (paket free tidak ditampilkan;
 * info free hanya muncul saat membuka konten terkunci). entitlement berasal
 * dari GET /dashboard/bab. onExpired dipanggil sekali saat masa premium habis
 * di jam browser, agar halaman memuat ulang kunci & kuota dari server.
 */
const PlanBanner = ({ entitlement, onExpired }) => {
  const [now, setNow] = useState(() => Date.now());
  const expiredNotifiedRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeUntil = entitlement?.active_until ?? null;
  const isPremium = entitlement?.plan === "premium";
  const timeLeft = isPremium && activeUntil ? formatTimeLeft(activeUntil, now) : null;

  useEffect(() => {
    if (!isPremium || !activeUntil || timeLeft) return;
    if (expiredNotifiedRef.current === activeUntil) return;
    expiredNotifiedRef.current = activeUntil;
    onExpired?.();
  }, [isPremium, activeUntil, timeLeft, onExpired]);

  // Fitur paket nonaktif: semua user "premium" tanpa batas, banner tidak relevan.
  if (!isPremium || entitlement.feature_enabled === false) return null;

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <img
        src={crownIcon}
        alt=""
        width="24"
        height="24"
        className="h-6 w-6 shrink-0 object-contain"
      />
      <p className="text-sm text-slate-700">
        {entitlement.is_trial ? (
          <>
            <span className="font-bold text-slate-900">Trial Premium aktif</span>
            {timeLeft && <> · sisa {timeLeft}</>}. Semua bab terbuka dan kuis
            tanpa batas.
          </>
        ) : (
          <>
            <span className="font-bold text-slate-900">
              {PACKAGE_LABELS[entitlement.package] || "Premium"} aktif
            </span>
            {activeUntil && <> hingga {formatDate(activeUntil)}</>}.
          </>
        )}
      </p>
    </div>
  );
};

export default PlanBanner;
