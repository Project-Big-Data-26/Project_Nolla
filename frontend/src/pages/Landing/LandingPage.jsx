import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  X,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import sdIcon from "../../assets/icon/SD.png";
import smpIcon from "../../assets/icon/SMP.png";
import smaIcon from "../../assets/icon/SMA.png";
import backgroundBack from "../../assets/background_back.png";
import siswaHero from "../../assets/siswa_hero.png";
import logoNolla from "../../assets/logo-nolla.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll effect detection for navbar background blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqList = [
    {
      q: "Apa bedanya Nolla dengan bimbel online biasa?",
      a: "Nolla fokus pada metode skill drill adaptif tanpa henti yang dirancang untuk membangun intuisi dan reflex matematika Anda. Bukan sekadar menonton rekaman video panjang, Anda langsung melatih keterampilan menyelesaikan ribuan variasi soal yang tingkat kesulitannya menyesuaikan kemampuan seketika.",
    },
    {
      q: "Apakah soalnya bisa sama terus atau berulang?",
      a: "Tidak! Bank soal kami didukung oleh algoritma cerdas yang menghasilkan variasi angka dan konteks masalah baru di setiap sesi drill. Siswa berlatih konsep, bukan menghafal jawaban soal.",
    },
    {
      q: "Bagaimana tingkat kesulitan soal ditentukan?",
      a: "Kami menggunakan klasifikasi Natural Language Processing (IndoBERT), validasi LLM mutakhir, dan kalibrasi Item Response Theory (IRT). Saat Anda sering menjawab benar, sistem menaikkan tantangan secara bertahap; jika Anda kesulitan, sistem memberikan latihan scaffolding yang pas.",
    },
    {
      q: "Cocok untuk jenjang dan tingkatan kelas berapa saja?",
      a: "Nolla dirancang komprehensif mulai dari Sekolah Dasar (SD kelas 1–6), Sekolah Menengah Pertama (SMP kelas 7–9), hingga Sekolah Menengah Atas (SMA kelas 10–12) dengan cakupan kurikulum matematika nasional terkini.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1b1f3b] font-['Poppins',sans-serif] antialiased selection:bg-[#ff8a1f]/20 selection:text-[#ff8a1f]">
      {/* -------------------- NAVBAR (Floating & Blurred on Scroll) -------------------- */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 rounded-b-2xl sm:rounded-b-3xl ${
          isScrolled
            ? "bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50 py-3"
            : "bg-white/90 backdrop-blur-sm shadow-sm py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand (Clean official logo) */}
          <Link to="/" className="flex items-center group">
            <img
              src={logoNolla}
              alt="NOLLA"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden md:flex items-center gap-6 lg:gap-8 text-[0.925rem] font-bold text-slate-700">
            <li>
              <a
                href="#masalah"
                className="hover:text-[#0284c7] transition-colors"
              >
                Kenapa Nolla
              </a>
            </li>
            <li>
              <a href="#cara" className="hover:text-[#0284c7] transition-colors">
                Cara Kerja
              </a>
            </li>
            <li>
              <a
                href="#jenjang"
                className="hover:text-[#0284c7] transition-colors"
              >
                Jenjang
              </a>
            </li>
            <li>
              <a href="#fitur" className="hover:text-[#0284c7] transition-colors">
                Keunggulan
              </a>
            </li>
            <li>
              <a href="#harga" className="hover:text-[#0284c7] transition-colors">
                Paket
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-[#0284c7] transition-colors">
                FAQ
              </a>
            </li>
          </ul>

          {/* Right Action CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/topik")}
                className="px-5 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#2563eb] to-[#0284c7] text-white shadow-md hover:shadow-[0_0_25px_rgba(37,99,235,0.7)] transition-all transform hover:-translate-y-0.5"
              >
                Buka Topik Belajar
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full font-bold text-sm text-[#0284c7] border-2 border-[#0284c7] hover:bg-[#0284c7] hover:text-white hover:shadow-[0_0_20px_rgba(2,132,199,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#009bf2] hover:bg-[#0086d4] text-white hover:shadow-[0_0_25px_rgba(0,155,242,0.85)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5"
                >
                  <span>Daftar Sekarang</span>
                  <span className="font-bold text-base leading-none ml-0.5">&gt;</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#e3e6f8] px-6 py-5 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3 font-semibold text-slate-700">
              <a
                href="#masalah"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#0284c7]"
              >
                Kenapa Nolla
              </a>
              <a
                href="#cara"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#0284c7]"
              >
                Cara Kerja
              </a>
              <a
                href="#jenjang"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#0284c7]"
              >
                Jenjang
              </a>
              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#0284c7]"
              >
                Keunggulan
              </a>
              <a
                href="#harga"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#0284c7]"
              >
                Paket
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#0284c7]"
              >
                FAQ
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/topik");
                  }}
                  className="w-full py-2.5 rounded-full font-bold text-center bg-[#2563eb] text-white"
                >
                  Buka Topik Belajar
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-full font-bold text-center text-[#0284c7] border-2 border-[#0284c7] hover:bg-[#0284c7] hover:text-white transition-all"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-full font-bold text-center bg-[#009bf2] text-white flex items-center justify-center gap-1.5"
                  >
                    <span>Daftar Sekarang</span>
                    <span className="font-bold text-base leading-none ml-0.5">&gt;</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* -------------------- HERO SECTION -------------------- */}
      <header className="relative overflow-hidden bg-[#1e40af] text-white pt-8 sm:pt-12 pb-0">
        {/* Background Image: classroom (background_back.png) with clearly visible opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-65 pointer-events-none scale-105"
          style={{ backgroundImage: `url(${backgroundBack})` }}
        />

        {/* Project Color Palette Overlay: Increased opacity by 10% (more solid/hard) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1d4ed8]/85 via-[#2563eb]/75 to-[#0284c7]/65 pointer-events-none backdrop-blur-[0.5px]" />

        {/* Mint-Green Organic Accent Shape in Top-Right */}
        <div className="absolute -top-16 -right-16 w-80 sm:w-[420px] h-52 sm:h-72 bg-[#00e5a3]/40 rounded-bl-[140px] rounded-br-[40px] blur-2xl pointer-events-none" />

        {/* Subtle Decorative Floating Math Watermark Elements */}
        <span className="absolute top-16 left-8 text-white/15 text-3xl sm:text-4xl font-mono select-none pointer-events-none font-bold">
          ∑
        </span>
        <span className="absolute bottom-16 left-1/4 text-white/15 text-2xl sm:text-3xl font-mono select-none pointer-events-none font-bold">
          √x
        </span>
        <span className="absolute top-24 right-1/3 text-white/15 text-3xl font-mono select-none pointer-events-none font-bold">
          π
        </span>
        <span className="absolute bottom-28 right-8 text-white/15 text-2xl font-mono select-none pointer-events-none font-bold">
          f(x)
        </span>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-end">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left pt-6 pb-12 lg:pb-20">
              {/* Subtle Math Formula Chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs text-white/90 font-mono tracking-wide select-none">
                <span className="text-[#ffd08a] font-bold">∫</span> f(x) dx · π ≈ 3.14 · a² + b² = c²
              </div>

              {/* Main Headline (Poppins font-semibold for reduced thickness) */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.15rem] font-semibold leading-[1.2] tracking-tight text-white drop-shadow-md">
                Tingkatkan Nilai Matematika Kamu dengan Latihan Soal Pribadi untuk SD, SMP, &amp; SMA
              </h1>

              {/* Description */}
              <p className="text-white/95 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-sm font-medium">
                Bersiaplah meraih prestasi tertinggi kamu bersama platform latihan
                matematika adaptif terpercaya. Ribuan variasi soal yang tak pernah
                berulang, mengasah logika dan pemahaman konsep secara bertahap.
              </p>

              {/* 2 CTA Buttons with Glowing Hover Effects */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {/* Mulai Drill Gratis (Blue with blue/cyan neon glow on hover and '>' icon) */}
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-[#009bf2] text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#0086d4] hover:shadow-[0_0_30px_rgba(0,155,242,0.85)] border-2 border-transparent text-center flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Mulai Drill Gratis</span>
                  <span className="font-bold text-lg leading-none ml-0.5 group-hover:translate-x-1 transition-transform">
                    &gt;
                  </span>
                </Link>

                {/* Lihat Cara Kerja (White turning Orange with bright orange glow on hover) */}
                <a
                  href="#cara"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-white text-slate-800 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#ff8a1f] hover:text-white hover:border-[#ff8a1f] hover:shadow-[0_0_30px_rgba(255,138,31,0.85)] border-2 border-transparent text-center flex items-center justify-center cursor-pointer"
                >
                  Lihat Cara Kerja
                </a>
              </div>
            </div>

            {/* Right Side: Students Photo - reduced by 1/3 and shifted slightly to the right */}
            <div className="lg:col-span-6 flex items-end justify-center lg:justify-end self-end h-full relative">
              <img
                src={siswaHero}
                alt="Siswa Siswi SD, SMP, SMA Nolla"
                className="w-auto h-[320px] sm:h-[380px] md:h-[420px] lg:h-[430px] xl:h-[480px] 2xl:h-[520px] max-w-full lg:max-w-none object-contain object-bottom align-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] select-none pointer-events-none block -mb-0.5 translate-x-2 sm:translate-x-4 lg:translate-x-6 xl:translate-x-8"
              />
            </div>
          </div>
        </div>
      </header>

      {/* -------------------- STATS BAR -------------------- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 border border-[#e3e6f8]">
          <div className="text-center p-2">
            <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1">
              10.000+
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
              Bank soal beraneka ragam
            </span>
          </div>

          <div className="text-center p-2 border-l border-slate-100">
            <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1">
              SD–SMA
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
              Semua jenjang sekolah
            </span>
          </div>

          <div className="text-center p-2 border-t md:border-t-0 md:border-l border-slate-100">
            <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1">
              Adaptif
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
              Level otomatis via AI IRT
            </span>
          </div>

          <div className="text-center p-2 border-t md:border-t-0 border-l border-slate-100">
            <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1">
              0 Soal Sama
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
              Tiap sesi baru selalu segar
            </span>
          </div>
        </div>
      </div>

      {/* -------------------- SECTION 1: MASALAH -------------------- */}
      <section id="masalah" className="py-20 lg:py-24 relative overflow-hidden">
        {/* Subtle background math elements */}
        <span className="absolute top-10 right-10 text-slate-100 text-6xl font-mono select-none pointer-events-none font-bold">
          ±
        </span>
        <span className="absolute bottom-10 left-10 text-slate-100 text-6xl font-mono select-none pointer-events-none font-bold">
          ÷
        </span>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
            Masalahnya
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
            Kenapa matematika terasa menakutkan?
          </h2>
          <p className="text-base sm:text-lg text-[#5b6088] max-w-2xl mx-auto mb-14">
            Rumusnya tak pernah berubah, tapi cari latihan yang lengkap dan
            beragam itu susah. Akhirnya siswa merasa terjebak dan menghindar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            <div className="bg-white rounded-2xl p-7 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  😨
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Mindset
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1b1f3b] mb-2">
                Mindset takut
              </h3>
              <p className="text-sm text-[#5b6088] leading-relaxed">
                Matematika dicap pelajaran paling menyeramkan dari tahun ke tahun
                karena kesalahan kecil langsung membuat nilai anjlok.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🔍
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Bank Soal
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1b1f3b] mb-2">
                Soal susah dicari
              </h3>
              <p className="text-sm text-[#5b6088] leading-relaxed">
                Latihan di internet terbatas, sering berulang, dan tidak
                terstruktur berdasarkan kompetensi bertingkat siswa.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Adaptif
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1b1f3b] mb-2">
                Nolla hadir
              </h3>
              <p className="text-sm text-[#5b6088] leading-relaxed">
                Latihan terstruktur, bertahap dari mudah hingga menantang, dan
                terasa seru seperti bermain game puzzle interaktif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 2: CARA KERJA -------------------- */}
      <section id="cara" className="py-20 lg:py-24 bg-[#f4f6ff] relative overflow-hidden">
        {/* Subtle background math elements */}
        <span className="absolute top-12 left-10 text-slate-200/80 text-5xl font-mono select-none pointer-events-none font-bold">
          log
        </span>
        <span className="absolute bottom-12 right-10 text-slate-200/80 text-5xl font-mono select-none pointer-events-none font-bold">
          ∞
        </span>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
            Cara Kerja
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
            3 langkah menuju jago
          </h2>
          <p className="text-base text-[#5b6088] max-w-xl mx-auto mb-14">
            Metode belajar santai tapi terbukti ampuh membentuk pemahaman intuitif
            yang melekat.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            <div className="bg-white rounded-2xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#2b3fd6]/10 text-[#2b3fd6] flex items-center justify-center font-black text-xl">
                  1️⃣
                </div>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  SD · SMP · SMA
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1b1f3b] mb-3">
                Pilih jenjang &amp; topik
              </h3>
              <p className="text-sm text-[#5b6088] leading-relaxed">
                Tersedia untuk jenjang SD, SMP, hingga SMA. Mulai langsung dari topik
                yang ingin kamu kuasai hari ini.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#ff8a1f]/15 text-[#ff8a1f] flex items-center justify-center font-black text-xl">
                  2️⃣
                </div>
                <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  θ Ability Score
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1b1f3b] mb-3">
                Drill soal adaptif
              </h3>
              <p className="text-sm text-[#5b6088] leading-relaxed">
                Terlalu mudah? Tingkat kesulitan otomatis naik. Merasa kesulitan? Sistem
                akan turun sedikit untuk memperkuat pemahaman dasar.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-xl">
                  3️⃣
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  +15 XP · Streak
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1b1f3b] mb-3">
                Naik level &amp; pantau
              </h3>
              <p className="text-sm text-[#5b6088] leading-relaxed">
                Dapatkan XP harian, pertahankan streak latihan, buka badge kehormatan,
                dan lihat grafik perkembangan kemampuanmu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 3: JENJANG -------------------- */}
      <section id="jenjang" className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
            Jenjang
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
            Untuk semua tahap belajar
          </h2>
          <p className="text-base text-[#5b6088] max-w-xl mx-auto mb-14">
            Setiap jenjang memiliki kurikulum dan tantangan yang disesuaikan dengan
            tahap perkembangan kognitif siswa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* SD */}
            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-[#2b3fd6]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform">
                    <img
                      src={sdIcon}
                      alt="Jenjang SD"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ¼ + ½ = ¾
                  </span>
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-800 mb-3">
                  Kelas 1 - 6
                </div>
                <h3 className="text-2xl font-bold text-[#1b1f3b] mb-2">
                  Sekolah Dasar (SD)
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed mb-6">
                  Berhitung dasar, pecahan, persentase, bangun datar, dan fondasi
                  logika matematika yang menyenangkan.
                </p>
              </div>
              <Link
                to={isAuthenticated ? "/topik" : "/register"}
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white transition-all text-center"
              >
                <span>Lihat Topik SD</span>
                <span className="font-bold text-base leading-none">&gt;</span>
              </Link>
            </div>

            {/* SMP */}
            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-[#2b3fd6]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform">
                    <img
                      src={smpIcon}
                      alt="Jenjang SMP"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    a² + b² = c²
                  </span>
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-blue-800 mb-3">
                  Kelas 7 - 9
                </div>
                <h3 className="text-2xl font-bold text-[#1b1f3b] mb-2">
                  Sekolah Menengah Pertama (SMP)
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed mb-6">
                  Aljabar persamaan linier, relasi dan fungsi, geometri ruang,
                  teorema Pythagoras, dan statistika dasar.
                </p>
              </div>
              <Link
                to={isAuthenticated ? "/topik" : "/register"}
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white transition-all text-center"
              >
                <span>Lihat Topik SMP</span>
                <span className="font-bold text-base leading-none">&gt;</span>
              </Link>
            </div>

            {/* SMA */}
            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-[#2b3fd6]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform">
                    <img
                      src={smaIcon}
                      alt="Jenjang SMA"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    ∫ f(x) dx
                  </span>
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100/70 text-indigo-800 mb-3">
                  Kelas 10 - 12
                </div>
                <h3 className="text-2xl font-bold text-[#1b1f3b] mb-2">
                  Sekolah Menengah Atas (SMA)
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed mb-6">
                  Fungsi kuadrat, trigonometri lanjut, kalkulus limit &amp; turunan,
                  matriks, dan teori peluang kombinatorika.
                </p>
              </div>
              <Link
                to={isAuthenticated ? "/topik" : "/register"}
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white transition-all text-center"
              >
                <span>Lihat Topik SMA</span>
                <span className="font-bold text-base leading-none">&gt;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 4: KEUNGGULAN -------------------- */}
      <section id="fitur" className="py-20 lg:py-24 bg-[#f4f6ff] relative overflow-hidden">
        {/* Subtle background math elements */}
        <span className="absolute top-12 right-12 text-slate-200/80 text-5xl font-mono select-none pointer-events-none font-bold">
          Δ
        </span>
        <span className="absolute bottom-12 left-12 text-slate-200/80 text-4xl font-mono select-none pointer-events-none font-bold">
          α + β
        </span>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
              Keunggulan
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
              Skill drill, bukan sekadar ujian
            </h2>
            <p className="text-base text-[#5b6088] max-w-xl mx-auto">
              Perbedaan mendasar antara menghafal formula ujian vs melatih
              keterampilan hingga menjadi insting alami.
            </p>
          </div>

          {/* 4 Cards Grid (Tabel Perbandingan telah dihapus sesuai permintaan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🎚️</div>
              <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5">Adaptif</h3>
              <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                Tingkat kesulitan mengikuti kondisi dan kemampuan pemahaman kamu
                secara dinamis.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">♾️</div>
              <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5">
                Soal tak berulang
              </h3>
              <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                Latihan sebanyak apa pun, variasinya selalu segar sehingga melatih
                logika sebenarnya.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5">
                Gamifikasi
              </h3>
              <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                Level, streak harian, dan badge prestasi yang membangkitkan rasa
                percaya diri belajar.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5">
                Soal tervalidasi AI
              </h3>
              <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                Diklasifikasi IndoBERT, diverifikasi LLM, dan dikalibrasi akurat
                dengan Item Response Theory (IRT).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 5: TESTIMONI -------------------- */}
      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
            Testimoni
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1b1f3b] mb-4">
            Kata mereka
          </h2>
          <p className="text-base text-[#5b6088] max-w-xl mx-auto mb-14">
            Cerita pengalaman nyata dari para siswa, orang tua, dan pendidik yang
            menggunakan Nolla.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-4 text-base">
                  {"★".repeat(5)}
                </div>
                <p className="text-base text-slate-800 italic leading-relaxed mb-6">
                  “Dulu takut matematika dan sering bingung rumus pecahan. Sekarang
                  malah ketagihan ngejar streak tiap pulang sekolah!”
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#2b3fd6]/10 text-[#2b3fd6] font-bold flex items-center justify-center">
                  R
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1b1f3b]">Rian Pratama</h4>
                  <p className="text-xs text-[#5b6088]">Siswa Kelas 8 SMP</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-4 text-base">
                  {"★".repeat(5)}
                </div>
                <p className="text-base text-slate-800 italic leading-relaxed mb-6">
                  “Anak saya sekarang berlatih mandiri tanpa harus disuruh-suruh.
                  Soalnya bertahap jadi dia tidak merasa tertekan.”
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#ff8a1f]/15 text-[#ff8a1f] font-bold flex items-center justify-center">
                  I
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1b1f3b]">Ibu Ratna Dewi</h4>
                  <p className="text-xs text-[#5b6088]">Orang Tua Siswa SD</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-4 text-base">
                  {"★".repeat(5)}
                </div>
                <p className="text-base text-slate-800 italic leading-relaxed mb-6">
                  “Level soalnya sangat pas dan adaptif. Sangat cocok direkomendasikan
                  sebagai suplemen latihan mandiri murid di kelas saya.”
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                  H
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1b1f3b]">Pak Hendra S.Pd.</h4>
                  <p className="text-xs text-[#5b6088]">Guru Matematika SMA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 6: PAKET HARGA -------------------- */}
      <section id="harga" className="py-20 lg:py-24 bg-[#f4f6ff]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
            Paket
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1b1f3b] mb-4">
            Pilih yang cocok
          </h2>
          <p className="text-base text-[#5b6088] max-w-xl mx-auto mb-14">
            Mulai dari paket gratis selamanya atau upgrade untuk akses tanpa batas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-2">Gratis</h3>
                <div className="text-3xl sm:text-4xl font-black text-[#2b3fd6] mb-3">
                  Rp0
                </div>
                <p className="text-sm text-[#5b6088] mb-6">
                  Cocok untuk mencoba drill dasar harian matematika.
                </p>
                <ul className="space-y-3 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    10 Soal drill adaptif per hari
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Pilihan jenjang SD, SMP, SMA
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Streak harian &amp; poin XP
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white transition-all text-center block"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Popular: Pelajar */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#ff8a1f] shadow-xl relative flex flex-col justify-between transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#ff8a1f] text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                Paling Diminati
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-2">Pelajar</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl sm:text-4xl font-black text-[#2b3fd6]">
                    Rp29.000
                  </span>
                  <span className="text-xs text-[#5b6088] font-bold">/ bulan</span>
                </div>
                <p className="text-sm text-[#5b6088] mb-6">
                  Akses penuh tanpa batas ke semua topik adaptif dan laporan
                  kemampuan.
                </p>
                <ul className="space-y-3 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Latihan soal tanpa batas harian
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Algoritma adaptif AI penuh (IRT)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Laporan analisis kelemahan &amp; grafik progres
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Review pembahasan lengkap langkah demi langkah
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full py-3 px-6 rounded-full font-bold text-sm bg-[#ff8a1f] hover:bg-[#ea7810] text-white shadow-md shadow-[#ff8a1f]/30 hover:shadow-lg transition-all text-center block"
              >
                Pilih Paket Pelajar
              </Link>
            </div>

            {/* Sekolah */}
            <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-2">Sekolah</h3>
                <div className="text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-3">
                  Hubungi Kami
                </div>
                <p className="text-sm text-[#5b6088] mb-6">
                  Solusi digital untuk guru, sekolah, dan bimbingan belajar.
                </p>
                <ul className="space-y-3 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Dashboard analitik guru &amp; wali kelas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Manajemen akun siswa per kelas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    Tugas &amp; drill terjadwal otomatis
                  </li>
                </ul>
              </div>
              <a
                href="#cta"
                className="w-full py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white transition-all text-center block"
              >
                Kontak Kemitraan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 7: FAQ -------------------- */}
      <section id="faq" className="py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#ff8a1f] tracking-widest uppercase mb-2 block">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1b1f3b] mb-4">
              Pertanyaan umum
            </h2>
            <p className="text-base text-[#5b6088]">
              Semua hal yang perlu kamu ketahui tentang cara belajar di Nolla.
            </p>
          </div>

          <div className="space-y-4">
            {faqList.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-[#e3e6f8] rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-bold text-base text-[#1b1f3b] hover:text-[#2b3fd6] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-[#5b6088] transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#2b3fd6]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#5b6088] leading-relaxed border-t border-slate-50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 8: CTA SECTION -------------------- */}
      <section
        id="cta"
        className="py-20 lg:py-24 bg-gradient-to-r from-[#ff8a1f] to-[#ff5d5d] text-white text-center relative overflow-hidden"
      >
        {/* Subtle background math elements */}
        <span className="absolute top-8 left-12 text-white/15 text-5xl font-mono select-none pointer-events-none font-bold">
          +
        </span>
        <span className="absolute bottom-8 right-14 text-white/15 text-5xl font-mono select-none pointer-events-none font-bold">
          ×
        </span>
        <span className="absolute top-1/2 left-10 text-white/10 text-4xl font-mono select-none pointer-events-none font-bold">
          =
        </span>
        <span className="absolute top-12 right-20 text-white/15 text-3xl font-mono select-none pointer-events-none font-bold">
          √
        </span>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
            Siap ubah “takut” jadi “bisa”?
          </h2>
          <p className="text-base sm:text-xl text-white/90 max-w-xl mx-auto mb-8">
            Daftar gratis sekarang dan mulai sesi drill pertamamu dalam hitungan detik.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-9 py-4 rounded-full font-black text-base bg-white text-[#ff8a1f] hover:bg-slate-100 shadow-xl shadow-black/15 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 group"
            >
              <span>Daftar Sekarang — Gratis</span>
              <span className="font-bold text-base leading-none group-hover:translate-x-1 transition-transform">
                &gt;
              </span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base bg-white/10 hover:bg-white/20 text-white border-2 border-white/50 hover:border-white transition-all text-center"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-[#0b1739] text-slate-300 py-16 text-sm border-t border-[#1e2e5c]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="inline-block bg-white px-3 py-1.5 rounded-xl shadow-sm mb-4">
                <img src={logoNolla} alt="NOLLA" className="h-7 w-auto object-contain" />
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Skill drill matematika adaptif untuk siswa SD–SMA. Melatih intuisi
                dan keterampilan berhitung secara bertahap dan menyenangkan.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">
                Produk
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#cara" className="hover:text-white transition-colors">
                    Cara Kerja
                  </a>
                </li>
                <li>
                  <a href="#jenjang" className="hover:text-white transition-colors">
                    Jenjang SD–SMA
                  </a>
                </li>
                <li>
                  <a href="#harga" className="hover:text-white transition-colors">
                    Paket Belajar
                  </a>
                </li>
                <li>
                  <Link to="/topik" className="hover:text-white transition-colors">
                    Daftar Topik
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">
                Bantuan &amp; Info
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Pertanyaan Umum (FAQ)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Syarat &amp; Ketentuan
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">
                Kontak
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a
                    href="mailto:halo@nolla.id"
                    className="hover:text-white transition-colors font-medium text-slate-200"
                  >
                    halo@nolla.id
                  </a>
                </li>
                <li className="pt-2 text-[11px] text-slate-400">
                  Instagram · TikTok · YouTube
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1e2e5c] text-center text-xs text-slate-400/80">
            © 2026 NOLLA. Proyek Big Data 2026. Hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
