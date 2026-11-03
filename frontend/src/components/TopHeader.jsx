import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import TopHeaderIllustration from "./TopHeaderIllustration";

const TopHeader = () => {
  const { user } = useAuth();
  // Menentukan sapaan berdasarkan waktu WIB
  const greeting = useMemo(() => {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date()),
    );
    if (hour >= 4 && hour < 10) return "Selamat Pagi, 👋";
    if (hour >= 10 && hour < 15) return "Selamat Siang, 👋";
    if (hour >= 15 && hour < 18) return "Selamat Sore, 👋";
    return "Selamat Malam, 👋";
  }, []);

  // Format nama pengguna dengan tanda seru di akhir
  const formattedName = useMemo(() => {
    const rawName = (user?.name || "User").trim();
    return rawName.endsWith("!") ? rawName : `${rawName}!`;
  }, [user]);

  return (
    <section
      id="top-header-section"
      className="relative w-full overflow-hidden rounded-2xl border-b border-[#d6e5fb] bg-gradient-to-r from-[#eaf3fe] via-[#edf5fe] to-[#e5eefc] px-4 pt-3 pb-1 mb-4 shadow-2xs sm:rounded-3xl sm:px-0 sm:pt-5 sm:pb-0 sm:mb-6 md:pt-7"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-row items-start justify-between gap-2 sm:items-end sm:gap-6 sm:px-8 md:px-10">
        {/* BAGIAN 1: TEKS HEADER (Rata kiri presisi dengan ruang vertikal yang lega) */}
        <div className="min-w-0 flex-1 pb-3 sm:pb-8 md:pb-10">
          {/* Font sedang: Good {Morning/dll} */}
          <div className="text-[11px] sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
            <span>{greeting}</span>
          </div>

          {/* Font besar: Nama pengguna */}
          <h1 className="break-words text-[15px] font-bold sm:text-3xl sm:font-extrabold lg:text-4xl text-[#1d63ed] tracking-tight leading-tight my-1">
            {formattedName}
          </h1>

          {/* Font kecil: Subtitle */}
          <p className="text-[11px] sm:text-sm text-slate-500 font-medium mt-1">
            Pantau Progresmu, Raih Potensi Terbaikmu.
          </p>
        </div>

        {/* BAGIAN 2: ILUSTRASI SVG (Proporsional tinggi mengikuti banner & menempel di dasar garis) */}
        <div className="hidden shrink-0 self-end items-end justify-center sm:flex md:justify-end md:pr-6 lg:pr-10 -mb-px">
          <div className="relative w-28 sm:w-64 md:w-72 h-12 sm:h-24 md:h-28 flex items-end justify-center">
            {/* SVG Ilustrasi Buku, Pot Tanaman, dan Awan Biru */}
            <TopHeaderIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopHeader;
