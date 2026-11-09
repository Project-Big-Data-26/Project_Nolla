// import React, { useMemo } from "react";
// import { useAuth } from "../context/AuthContext";

// const TopHeader = () => {
//   const { user } = useAuth();
//   // Menentukan sapaan berdasarkan waktu WIB
//   const greeting = useMemo(() => {
//     const hour = Number(
//       new Intl.DateTimeFormat("en-US", {
//         timeZone: "Asia/Jakarta",
//         hour: "2-digit",
//         hourCycle: "h23",
//       }).format(new Date()),
//     );
//     if (hour >= 4 && hour < 10) return "Selamat Pagi, 👋";
//     if (hour >= 10 && hour < 15) return "Selamat Siang, 👋";
//     if (hour >= 15 && hour < 18) return "Selamat Sore, 👋";
//     return "Selamat Malam, 👋";
//   }, []);

//   // Format nama pengguna dengan tanda seru di akhir
//   const formattedName = useMemo(() => {
//     const rawName = (user?.name || "User").trim();
//     return rawName.endsWith("!") ? rawName : `${rawName}!`;
//   }, [user]);

//   return (
//     <section
//       id="top-header-section"
//       className="relative w-full overflow-hidden rounded-2xl border-b border-[#d6e5fb] bg-gradient-to-r from-[#eaf3fe] via-[#edf5fe] to-[#e5eefc] px-4 pt-3 pb-1 mb-4 shadow-2xs sm:rounded-3xl sm:px-0 sm:pt-5 sm:pb-0 sm:mb-6 md:pt-7"
//     >
//       <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-row items-start justify-between gap-2 sm:items-end sm:gap-6 sm:px-8 md:px-10">
//         {/* BAGIAN 1: TEKS HEADER (Rata kiri presisi dengan ruang vertikal yang lega) */}
//         <div className="relative z-10 min-w-0 flex-1 pb-3 sm:pb-8 md:pb-10">
//           {/* Font sedang: Good {Morning/dll} */}
//           <div className="text-[11px] sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
//             <span>{greeting}</span>
//           </div>

//           {/* Font besar: Nama pengguna */}
//           <h1 className="break-words text-[15px] font-bold sm:text-3xl sm:font-extrabold lg:text-4xl text-[#1d63ed] tracking-tight leading-tight my-1">
//             {formattedName}
//           </h1>

//           {/* Font kecil: Subtitle */}
//           <p className="text-[11px] sm:text-sm text-slate-500 font-medium mt-1">
//             Pantau Progresmu, Raih Potensi Terbaikmu.
//           </p>
//         </div>

//         {/* BAGIAN 2: ILUSTRASI MATEMATIKA */}
//         <div className="absolute bottom-0 right-0 z-0 flex h-24 w-24 items-end justify-center -mb-px sm:relative sm:shrink-0 sm:self-end sm:items-end sm:justify-center sm:h-24 sm:w-72 sm:overflow-visible md:justify-end md:pr-4 lg:pr-6 md:h-28 md:w-80">
//           <div className="relative flex h-full w-full items-end justify-center overflow-visible">
//             <img
//               src="/images/math-study-header.webp"
//               alt="Buku catatan dan kalkulator matematika"
//               className="h-24 w-24 translate-y-8 object-contain sm:absolute sm:bottom-0 sm:left-1/2 sm:h-48 sm:w-48 sm:max-w-none sm:-translate-x-1/2 sm:translate-y-7 md:translate-y-8 md:h-52 md:w-52"
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default TopHeader;
import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

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

  // Tampilkan hanya kata pertama dari nama pengguna.
  const formattedName = useMemo(() => {
    const rawName = (user?.name || "User").trim();
    const firstName = rawName.split(/\s+/)[0] || "User";
    return firstName.endsWith("!") ? firstName : `${firstName}!`;
  }, [user]);

  return (
    <section
      id="top-header-section"
      className="relative mb-4 w-full overflow-hidden rounded-2xl border border-[#d6e5fb] bg-gradient-to-r from-[#eaf3fe] via-[#edf5fe] to-[#e5eefc] shadow-2xs sm:mb-6 sm:rounded-3xl"
    >
      <div className="relative mx-auto flex w-full max-w-5xl items-center px-4 py-4 sm:min-h-[150px] sm:px-8 sm:py-6 md:px-10">
        {/* BAGIAN 1: TEKS HEADER */}
        <div className="relative z-10 min-w-0 flex-1 pr-20 sm:pr-72 md:pr-80">
          {/* Sapaan */}
          <p className="text-[11px] font-semibold text-slate-700 sm:text-sm">
            {greeting}
          </p>

          {/* Nama pengguna */}
          <h1 className="my-0.5 break-words text-xl font-extrabold leading-tight tracking-tight text-[#1d63ed] sm:my-1 sm:text-2xl lg:text-3xl">
            {formattedName}
          </h1>

          {/* Subtitle */}
          <p className="text-[11px] font-medium leading-snug text-slate-500 sm:text-sm">
            Pantau Progresmu, Raih Potensi Terbaikmu.
          </p>
        </div>

        {/* BAGIAN 2: ILUSTRASI (selalu di tengah vertikal) */}
        <img
          src="/images/math-study-header.webp"
          alt=""
          aria-hidden="true"
          width="1402"
          height="1122"
          loading="eager"
          fetchPriority="high"
          className="pointer-events-none absolute -right-2 top-1/2 z-0 h-24 w-auto max-w-none -translate-y-1/2 object-contain sm:right-8 sm:h-36 md:right-10 md:h-40"
        />
      </div>
    </section>
  );
};

export default TopHeader;
