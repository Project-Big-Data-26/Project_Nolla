import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, Toaster } from "sonner";

import sdIcon from "../../assets/icon/SD.png";
import smpIcon from "../../assets/icon/SMP.png";
import smaIcon from "../../assets/icon/SMA.png";

const educationOptions = [
  {
    id: "sd",
    label: "Sekolah Dasar (SD)",
    badge: "Kelas 1 - 6",
    desc: "Membangun fondasi logika matematika dan pemahaman dasar.",
    illustration: sdIcon,
  },
  {
    id: "smp",
    label: "Sekolah Menengah (SMP)",
    badge: "Kelas 7 - 9",
    desc: "Eksplorasi aljabar, geometri, dan pemecahan masalah interaktif.",
    illustration: smpIcon,
  },
  {
    id: "sma",
    label: "Sekolah Menengah (SMA)",
    badge: "Kelas 10 - 12",
    desc: "Persiapan matang kalkulus, statistik, dan ujian masuk perguruan tinggi.",
    illustration: smaIcon,
  },
];

export default function PersonalizationWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [educationLevel, setEducationLevel] = useState("");
  const [loading, setLoading] = useState(false);

  // Tangkap token dari URL jika dialihkan dari Google OAuth
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get("accessToken");
    const refreshTokenFromUrl = queryParams.get("refreshToken");

    if (tokenFromUrl) {
      localStorage.setItem("accessToken", tokenFromUrl);
      if (refreshTokenFromUrl) {
        localStorage.setItem("refreshToken", refreshTokenFromUrl);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleSavePersonalization = async () => {
    if (!educationLevel) {
      toast.warning("Pilih Jenjang Pendidikan", {
        description:
          "Harap pilih salah satu jenjang pendidikan sebelum melanjutkan.",
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        "http://localhost:5000/api/personalization",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            educationLevel: educationLevel,
          }),
        },
      );

      const result = await response.json();

      if (response.ok && result.status === "success") {
        toast.success("Jenjang pendidikan berhasil disimpan!", {
          description: "Mengalihkan Anda ke Dashboard...",
        });

        setTimeout(() => {
          navigate("/");
        }, 1200);
      } else {
        toast.error("Gagal Menyimpan", {
          description: result.message || "Gagal menyimpan personalisasi.",
        });
      }
    } catch (error) {
      console.error("Error detail koneksi server:", error);
      toast.error("Masalah Jaringan", {
        description:
          "Terjadi kesalahan pada koneksi server. Cek console (F12).",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-bg flex flex-col justify-between font-sans overflow-x-hidden">
      <Toaster position="top-center" richColors closeButton />

      {/* HEADER SECTION */}
      <header className="relative z-20 flex items-center justify-end px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xs font-semibold text-neutral-muted hover:text-neutral-text transition-colors cursor-pointer"
        >
          Lewati
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-20 flex-1 flex flex-col items-center px-4 pt-2 md:pt-4 pb-8 md:pb-16 max-w-5xl mx-auto w-full">
        {/* HERO TITLE TEXT (Posisi Digeser Lebih ke Atas) */}
        <div className="text-center max-w-2xl mb-6 md:mb-10 px-2">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-neutral-muted uppercase">
            Sebelum Memulai Petualangan Belajarmu
          </span>
          <h1 className="mt-1 sm:text-3xl md:text-4xl font-extrabold text-neutral-text font-heading">
            Pilih Jenjang Pendidikanmu
          </h1>
        </div>

        {/* CARDS GRID CONTAINER (1 Kolom di HP, 3 Kolom di Desktop) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2 md:translate-y-6">
          {educationOptions.map(({ id, label, badge, desc, illustration }) => {
            const isSelected = educationLevel === id;

            return (
              <div
                key={id}
                onClick={() => setEducationLevel(id)}
                className={`group relative rounded-2xl bg-neutral-card p-5 sm:p-6 shadow-md md:shadow-xl transition-all duration-300 border-2 cursor-pointer flex flex-col justify-between items-center text-center hover:-translate-y-1.5 ${
                  isSelected
                    ? "border-primary ring-4 ring-primary/20 shadow-xl"
                    : "border-neutral-border hover:border-primary/40"
                }`}
              >
                {/* ILUSTRASI CONTAINER */}
                <div className="w-full h-24 sm:h-32 md:h-36 flex items-center justify-center p-2 mb-3 md:mb-4">
                  <img
                    src={illustration}
                    alt={label}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* CONTENT TEXT */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-semibold bg-neutral-bg text-neutral-muted px-2.5 py-1 rounded-full mb-2">
                    {badge}
                  </span>
                  <h3 className="font-heading font-bold text-base text-neutral-text mb-1.5">
                    {label}
                  </h3>
                  <p className="text-xs text-neutral-muted leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* INDIKATOR BULAT SELECTION */}
                <div className="mt-4 md:mt-6 flex items-center justify-center">
                  <div
                    className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-neutral-bg text-neutral-border group-hover:border-primary/50 border"
                    }`}
                  >
                    {isSelected ? (
                      <svg
                        className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-neutral-border group-hover:bg-primary/50" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TOMBOL SUBMIT */}
        <div className="w-full max-w-xs mt-8 md:mt-14 relative z-30 px-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleSavePersonalization}
            className="w-full py-3.5 px-6 rounded-xl bg-white text-primary font-extrabold text-xs shadow-lg hover:bg-neutral-bg hover:scale-105 active:scale-95 transition-all cursor-pointer border border-neutral-border md:border-white/40 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan & Mulai Belajar →"}
          </button>
        </div>
      </main>

      {/* BACKGROUND PRIMARY / AREA BIRU */}
      <div className="relative md:absolute md:bottom-0 md:left-0 md:right-0 h-28 md:h-1/3 bg-primary z-0 overflow-hidden pointer-events-none mt-6 md:mt-0">
        {/* Pattern Titik-Titik */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Ornaments */}
        <div className="absolute -left-16 -bottom-16 w-48 md:w-64 h-48 md:h-64 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute left-6 md:left-10 bottom-4 w-16 md:w-24 h-16 md:h-24 rounded-full border-2 border-white/20 pointer-events-none" />

        <div className="absolute left-1/2 -translate-x-1/2 top-2 md:top-4 w-32 md:w-40 h-32 md:h-40 rounded-full border border-white/15 pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-60 md:w-80 h-60 md:h-80 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="absolute -right-16 -bottom-20 w-60 md:w-80 h-60 md:h-80 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute right-6 md:right-12 top-4 md:top-6 w-24 md:w-36 h-24 md:h-36 rounded-full border-2 border-white/15 pointer-events-none" />
      </div>
    </div>
  );
}
