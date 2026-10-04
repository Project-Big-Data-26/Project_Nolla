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
      className="w-full relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#eaf3fe] via-[#edf5fe] to-[#e5eefc] border-b border-[#d6e5fb] pt-3 sm:pt-5 md:pt-7 pb-0 mb-6 shadow-2xs"
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-10 w-full flex flex-row items-end justify-between gap-2 sm:gap-6 relative z-10">
        {/* BAGIAN 1: TEKS HEADER (Rata kiri presisi dengan ruang vertikal yang lega) */}
        <div className="flex-1 min-w-0 pb-3 sm:pb-8 md:pb-10">
          {/* Font sedang: Good {Morning/dll} */}
          <div className="text-[10px] sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
            <span>{greeting}</span>
          </div>

          {/* Font besar: Nama pengguna */}
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#1d63ed] tracking-tight leading-tight my-1">
            {formattedName}
          </h1>

          {/* Font kecil: Subtitle */}
          <p className="text-[10px] sm:text-sm text-slate-500 font-medium mt-1">
            Pantau Progresmu, Raih Potensi Terbaikmu.
          </p>
        </div>

        {/* BAGIAN 2: ILUSTRASI SVG (Proporsional tinggi mengikuti banner & menempel di dasar garis) */}
        <div className="shrink-0 self-end flex items-end justify-center md:justify-end md:pr-6 lg:pr-10 -mb-px">
          <div className="relative w-36 sm:w-64 md:w-72 h-16 sm:h-24 md:h-28 flex items-end justify-center">
            {/* SVG Ilustrasi Buku, Pot Tanaman, dan Awan Biru */}
            <TopHeaderIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopHeader;
