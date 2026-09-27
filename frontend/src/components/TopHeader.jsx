import React, { useMemo } from "react";

const TopHeader = ({ userName = "User" }) => {
  // Menentukan sapaan waktu otomatis (Morning, Afternoon, Evening, Night)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good Morning, 👋";
    if (hour >= 12 && hour < 17) return "Good Afternoon, 👋";
    if (hour >= 17 && hour < 21) return "Good Evening, 👋";
    return "Good Night, 👋";
  }, []);

  // Format nama pengguna dengan tanda seru di akhir
  const formattedName = useMemo(() => {
    const rawName = (
      localStorage.getItem("user_name") ||
      userName ||
      "User"
    ).trim();
    return rawName.endsWith("!") ? rawName : `${rawName}!`;
  }, [userName]);

  return (
    <section
      id="top-header-section"
      className="w-full relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#eaf3fe] via-[#edf5fe] to-[#e5eefc] border-b border-[#d6e5fb] pt-3 sm:pt-5 md:pt-7 pb-0 mb-6 shadow-2xs"
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 relative z-10">
        {/* BAGIAN 1: TEKS HEADER (Rata kiri presisi dengan ruang vertikal yang lega) */}
        <div className="flex-1 min-w-0 pb-6 sm:pb-8 md:pb-10">
          {/* Font sedang: Good {Morning/dll} */}
          <div className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
            <span>{greeting}</span>
          </div>

          {/* Font besar: Nama pengguna */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1d63ed] tracking-tight leading-tight my-1">
            {formattedName}
          </h1>

          {/* Font kecil: Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Stay update with your academy journey.
          </p>
        </div>

        {/* BAGIAN 2: ILUSTRASI SVG (Proporsional tinggi mengikuti banner & menempel di dasar garis) */}
        <div className="shrink-0 self-end flex items-end justify-center md:justify-end md:pr-6 lg:pr-10 -mb-px">
          <div className="relative w-52 sm:w-64 md:w-72 h-20 sm:h-24 md:h-28 flex items-end justify-center">
            {/* SVG Ilustrasi Buku, Pot Tanaman, dan Awan Biru */}
            <svg
              viewBox="0 10 245 78"
              className="w-full h-full overflow-visible select-none pointer-events-none block"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Samar-samar awan biru gradient */}
                <linearGradient
                  id="cloudGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="blueBook" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient
                  id="yellowBook"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient
                  id="darkBlueBook"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient
                  id="plantLeaf"
                  x1="0%"
                  y1="100%"
                  x2="0%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>

              {/* Samar-samar awan biru di background */}
              <g className="opacity-70">
                {/* Awan kiri belakang pot */}
                <path
                  d="M15 65C15 54 24 45 35 45C37 45 39 45.4 41 46.2C44.5 36.5 53.8 30 65 30C78.8 30 90 41.2 90 55C90 56 89.9 57 89.7 58C95.5 59.8 100 65 100 71C100 78.7 93.7 85 86 85H28C20.8 85 15 79.2 15 72C15 69.5 15.7 67.2 17 65.2C15.8 65.1 15 65 15 65Z"
                  fill="url(#cloudGrad)"
                />
                {/* Awan kanan atas buku */}
                <path
                  d="M170 42C170 34 176 27 184 27C185.5 27 187 27.3 188.5 27.9C191.5 20.8 198.8 16 207 16C218 16 227 24.5 227 35C227 35.8 226.9 36.6 226.7 37.4C231.5 38.8 235 43 235 48C235 54 230 59 224 59H180C174.5 59 170 54.5 170 49C170 46.5 170.8 44.2 172.2 42.4C170.8 42.3 170 42 170 42Z"
                  fill="url(#cloudGrad)"
                  opacity="0.75"
                />
                {/* Siluet burung kecil di awan */}
                <path
                  d="M218 18C221 16 223 18 225 18C227 18 229 16 232 18"
                  stroke="#93c5fd"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M228 12C230 10.5 231.5 12 233 12C234.5 12 236 10.5 238 12"
                  stroke="#93c5fd"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </g>

              {/* POT TANAMAN */}
              <g id="potted-plant">
                <path
                  d="M93 68C92 50 97 34 94 24C96 28 103 40 96 66"
                  fill="url(#plantLeaf)"
                />
                <path
                  d="M91 66C82 56 75 48 68 46C74 53 82 62 89 69"
                  fill="url(#plantLeaf)"
                />
                <path
                  d="M90 62C78 57 71 59 66 61C72 65 80 67 88 67"
                  fill="#15803d"
                />
                <path
                  d="M95 64C104 53 113 47 120 48C113 54 105 61 97 68"
                  fill="url(#plantLeaf)"
                />
                <path
                  d="M96 60C108 55 116 58 121 61C115 64 107 65 98 66"
                  fill="#22c55e"
                />

                <rect
                  x="80"
                  y="68"
                  width="28"
                  height="4"
                  rx="2"
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <path
                  d="M82 72L85 88H103L106 72H82Z"
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
              </g>

              {/* TUMPUKAN BUKU */}
              <g id="book-stack">
                <g id="bottom-book">
                  <rect
                    x="126"
                    y="74"
                    width="112"
                    height="13"
                    rx="1"
                    fill="#f8fafc"
                    stroke="#e2e8f0"
                    strokeWidth="0.8"
                  />
                  <line
                    x1="236"
                    y1="76"
                    x2="236"
                    y2="85"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line
                    x1="234"
                    y1="76"
                    x2="234"
                    y2="85"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <rect
                    x="122"
                    y="73"
                    width="118"
                    height="4"
                    rx="1.5"
                    fill="url(#darkBlueBook)"
                  />
                  <rect
                    x="120"
                    y="84"
                    width="120"
                    height="4"
                    rx="1.5"
                    fill="url(#darkBlueBook)"
                  />
                  <path
                    d="M120 74C120 73 121 73 122 73V88C121 88 120 87 120 86V74Z"
                    fill="#1e3a8a"
                  />
                </g>

                <g id="middle-book">
                  <rect
                    x="132"
                    y="60"
                    width="102"
                    height="12"
                    rx="1"
                    fill="#fffbeb"
                    stroke="#fde68a"
                    strokeWidth="0.7"
                  />
                  <rect
                    x="128"
                    y="58"
                    width="108"
                    height="4"
                    rx="1.5"
                    fill="url(#yellowBook)"
                  />
                  <rect
                    x="127"
                    y="70"
                    width="109"
                    height="4"
                    rx="1.5"
                    fill="url(#yellowBook)"
                  />
                  <path
                    d="M127 59C127 58 128 58 129 58V74C128 74 127 73 127 72V59Z"
                    fill="#d97706"
                  />
                </g>

                <g id="top-book">
                  <rect
                    x="137"
                    y="47"
                    width="94"
                    height="10"
                    rx="1"
                    fill="#f8fafc"
                    stroke="#e2e8f0"
                    strokeWidth="0.7"
                  />
                  <rect
                    x="133"
                    y="45"
                    width="100"
                    height="3.5"
                    rx="1.5"
                    fill="url(#blueBook)"
                  />
                  <rect
                    x="132"
                    y="55"
                    width="101"
                    height="3.5"
                    rx="1.5"
                    fill="url(#blueBook)"
                  />
                  <path
                    d="M132 46C132 45 133 45 134 45V58C133 58 132 58 132 57V46Z"
                    fill="#1e40af"
                  />
                  <path
                    d="M178 45V68L183 64L188 68V45H178Z"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="0.5"
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopHeader;
