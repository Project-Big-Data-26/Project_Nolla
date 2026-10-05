import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Menu,
  X,
  Check,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import sdIcon from "../../assets/icon/SD.png";
import smpIcon from "../../assets/icon/SMP.png";
import smaIcon from "../../assets/icon/SMA.png";
import backgroundBack from "../../assets/background_back.png";
import siswaHero from "../../assets/siswa_hero.png";
import siswaMenunjuk from "../../assets/siswa_menunjuk.png";
import siswaSd from "../../assets/siswa_sd.png";
import logoNolla from "../../assets/logo-nolla.png";
import mathLightbulb from "../../assets/komponenTambahan2.png";
import mathGeometry from "../../assets/komponenTambahan3.png";
import mathPi from "../../assets/komponenTambahan4.png";
import mathOperators from "../../assets/komponenTambahan5.png";
import mathCalculus from "../../assets/komponenTambahan6.png";
import mathSigma from "../../assets/komponenTambahan7.png";
import mathBooks from "../../assets/komponenTambahan8.png";
import mathNumberTower from "../../assets/komponenTambahan9.png";
import pialaIcon from "../../assets/Piala-komponenTambahan10.png";

// Bidirectional Fade-In on Scroll Component
const FadeInSection = ({
  children,
  className = "",
  delay = 0,
  variant = "fade-up", // "fade-up" | "scale-up"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Triggers both when scrolling down and scrolling back up
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const el = domRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const hiddenClasses =
    variant === "scale-up"
      ? "opacity-0 scale-[0.96] translate-y-6"
      : "opacity-0 translate-y-8";

  const visibleClasses =
    variant === "scale-up"
      ? "opacity-100 scale-100 translate-y-0"
      : "opacity-100 translate-y-0";

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${isVisible ? visibleClasses : hiddenClasses
        } ${className}`}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mencegah scroll background saat mobile drawer navbar terbuka
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Parallax tracking for Hero elements
  const [heroParallax, setHeroParallax] = useState({ x: 0, y: 0 });
  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setHeroParallax({ x, y });
  };
  const handleHeroMouseLeave = () => {
    setHeroParallax({ x: 0, y: 0 });
  };

  // Scroll Progress and Navbar background state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterStatus("success");
      setNewsletterEmail("");
      setTimeout(() => {
        setNewsletterStatus(null);
      }, 4000);
    }
  };

  // Scroll effect detection for navbar background blur & scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scrolled = (totalScroll / windowHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrolled)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation Smooth Scroll Handlers
  const scrollToTop = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToSection = (e, sectionId) => {
    if (e && e.preventDefault) e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      const offsetPosition = elementPosition + currentScrollY - navOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });
      setMobileMenuOpen(false);
    }
  };

  // Testimonial Cursor Notification State (Shows for 3 seconds only)
  const [showTestimonialHint, setShowTestimonialHint] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const testimonialHintTimer = useRef(null);

  const handleMouseEnterTestimonial = () => {
    setShowTestimonialHint(true);
    if (testimonialHintTimer.current) {
      clearTimeout(testimonialHintTimer.current);
    }
    // Automatically hide after 3 seconds
    testimonialHintTimer.current = setTimeout(() => {
      setShowTestimonialHint(false);
    }, 3000);
  };

  const handleMouseLeaveTestimonial = () => {
    setShowTestimonialHint(false);
    if (testimonialHintTimer.current) {
      clearTimeout(testimonialHintTimer.current);
    }
  };

  // FAQ Accordion State & Smooth Scroll Refs
  const [openFaq, setOpenFaq] = useState(null);
  const faqItemRefs = useRef([]);

  const toggleFaq = (index) => {
    const isOpening = openFaq !== index;
    setOpenFaq(isOpening ? index : null);

    if (isOpening) {
      // Smoothly glide viewport so the opened question & answer are centered
      setTimeout(() => {
        const el = faqItemRefs.current[index];
        if (el) {
          const rect = el.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const elementHeight = el.offsetHeight || 130;
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + currentScrollY;
          const targetY = Math.max(
            0,
            elementTop - (windowHeight - elementHeight) / 2
          );

          window.scrollTo({
            top: targetY,
            behavior: "smooth",
          });
        }
      }, 90);
    }
  };

  // Testimonials Data for Horizontal Ticker
  const testimonials = [
    {
      name: "Rian Pratama",
      role: "Siswa Kelas 8 SMP",
      initial: "R",
      avatarBg: "bg-blue-100 text-blue-700",
      rating: 5,
      highlight: "Nilai Ulangan Naik Drastis",
      text: "Dulu takut matematika dan sering bingung rumus pecahan. Sekarang malah ketagihan ngejar streak tiap pulang sekolah!",
      tag: "Aljabar & Pecahan",
    },
    {
      name: "Ibu Ratna Dewi",
      role: "Orang Tua Siswa SD",
      initial: "I",
      avatarBg: "bg-amber-100 text-amber-700",
      rating: 5,
      highlight: "Anak Mandiri Berlatih",
      text: "Anak saya sekarang berlatih mandiri tanpa harus disuruh-suruh. Soalnya bertahap jadi dia tidak merasa tertekan.",
      tag: "SD Kelas 4",
    },
    {
      name: "Pak Hendra S.Pd.",
      role: "Guru Matematika SMA",
      initial: "H",
      avatarBg: "bg-emerald-100 text-emerald-700",
      rating: 5,
      highlight: "Rekomendasi Guru",
      text: "Level soalnya sangat pas dan adaptif. Sangat cocok direkomendasikan sebagai suplemen latihan mandiri murid di kelas saya.",
      tag: "Pengajar Berpengalaman",
    },
    {
      name: "Alya Zahra",
      role: "Siswi Kelas 5 SD",
      initial: "A",
      avatarBg: "bg-purple-100 text-purple-700",
      rating: 5,
      highlight: "Belajar Berasa Main Game",
      text: "Seru banget ada XP dan streak-nya kayak main game! Sekarang ulangan harian matematika nilaiku selalu di atas 90.",
      tag: "Operasi Hitung",
    },
    {
      name: "Dimas Arya",
      role: "Siswa Kelas 12 SMA",
      initial: "D",
      avatarBg: "bg-cyan-100 text-cyan-700",
      rating: 5,
      highlight: "Siap Tembus UTBK",
      text: "Persiapan UTBK matematika jadi jauh lebih terarah. Soal adaptifnya ngebantu nemuin kelemahan di topik matriks dan limit.",
      tag: "Target PTN",
    },
    {
      name: "Bu Maya Siregar",
      role: "Wali Murid SMP",
      initial: "M",
      avatarBg: "bg-rose-100 text-rose-700",
      rating: 5,
      highlight: "Progres Terpantau",
      text: "Sistem grafik kemajuannya transparan sekali. Saya bisa memantau topik mana yang anak saya sudah kuasai dengan mudah.",
      tag: "Monitoring Siswa",
    },
  ];

  const faqList = [
    {
      q: "Apa bedanya Nolla dengan bimbel online biasa?",
      a: "Nolla fokus pada metode skill drill adaptif tanpa henti yang dirancang untuk membangun intuisi dan reflex matematika Anda. Bukan sekadar menonton rekaman video panjang, Anda langsung melatih keterampilan menyelesaikan ribuan variasi soal yang tingkat kesulitannya menyesuaikan kemampuan seketika.",
    },
    {
      q: "Apakah soalnya terus berulang?",
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
      {/* -------------------- TOP SCROLL PROGRESS BAR -------------------- */}
      <div className="fixed top-0 left-0 w-full h-[3.5px] z-[100] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#2563eb] via-[#ff8a1f] to-[#ff5745] transition-all duration-75 ease-out shadow-[0_0_10px_rgba(255,138,31,0.85)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* -------------------- NAVBAR (Floating & Blurred on Scroll) -------------------- */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 rounded-b-2xl sm:rounded-b-3xl ${isScrolled
          ? "bg-white/60 backdrop-blur-md shadow-lg border-b border-slate-200/50 py-3"
          : "bg-white/100 backdrop-blur-sm shadow-sm py-4"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand (Click smoothly scrolls to top) */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center group cursor-pointer bg-transparent border-0 p-0 text-left"
            title="Kembali ke atas"
          >
            <img
              src={logoNolla}
              alt="NOLLA"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </button>

          {/* Desktop Navigation Links */}
          <ul className="hidden md:flex items-center gap-6 lg:gap-8 text-[0.925rem] font-bold text-slate-700">
            <li>
              <a
                href="#masalah"
                onClick={(e) => scrollToSection(e, "masalah")}
                className="hover:text-[#0284c7] transition-colors cursor-pointer"
              >
                Kenapa Nolla
              </a>
            </li>
            <li>
              <a
                href="#cara"
                onClick={(e) => scrollToSection(e, "cara")}
                className="hover:text-[#0284c7] transition-colors cursor-pointer"
              >
                Cara Kerja
              </a>
            </li>
            <li>
              <a
                href="#jenjang"
                onClick={(e) => scrollToSection(e, "jenjang")}
                className="hover:text-[#0284c7] transition-colors cursor-pointer"
              >
                Jenjang
              </a>
            </li>
            <li>
              <a
                href="#fitur"
                onClick={(e) => scrollToSection(e, "fitur")}
                className="hover:text-[#0284c7] transition-colors cursor-pointer"
              >
                Keunggulan
              </a>
            </li>
            <li>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, "faq")}
                className="hover:text-[#0284c7] transition-colors cursor-pointer"
              >
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
                  className="px-5 py-2 rounded-full font-bold text-sm text-[#ff8a1f] border-2 border-[#ff8a1f] hover:bg-[#ff8a1f] hover:text-white hover:border-[#ff8a1f] hover:shadow-[0_0_20px_rgba(255,138,31,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#009bf2] hover:bg-[#1e3a8a] text-white hover:shadow-[0_0_25px_rgba(56,189,248,0.85)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5"
                >
                  <span>Daftar Sekarang</span>
                  <span className="font-bold text-base leading-none ml-0.5">&gt;</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Buka navigasi menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* -------------------- MOBILE DRAWER SIDEBAR & BACKDROP -------------------- */}
      {/* Backdrop di sisi kanan: klik area bukan putih untuk menutup sidebar */}
      <div
        className={`fixed inset-0 bg-slate-950/60 z-[90] transition-opacity duration-300 md:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Panel Drawer dari samping kiri - Sesuai referensi Nurul Fikri */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[76%] max-w-[300px] h-full bg-white z-[100] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
      >
        {/* Bagian Atas: Logo paling atas, lalu list link pagenya dari bawah logo satu-satu kebawah */}
        <div className="flex-1 overflow-y-auto">
          {/* Logo paling atas */}
          <div className="px-6 pt-7 pb-5">
            <button
              type="button"
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToTop(e);
              }}
              className="block cursor-pointer bg-transparent border-0 p-0 text-left"
            >
              <img
                src={logoNolla}
                alt="NOLLA"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </button>
          </div>

          {/* List link page dari bawah logo satu-satu kebawah */}
          <div className="px-4 py-2 space-y-1 text-slate-800">
            <button
              type="button"
              onClick={(e) => scrollToSection(e, "masalah")}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-50 hover:text-[#0284c7] font-bold text-sm sm:text-base transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Kenapa Nolla</span>
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection(e, "cara")}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-50 hover:text-[#0284c7] font-bold text-sm sm:text-base transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Cara Kerja</span>
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection(e, "jenjang")}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-50 hover:text-[#0284c7] font-bold text-sm sm:text-base transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span>Jenjang</span>
              <span className="text-slate-400 group-hover:text-[#0284c7] font-bold text-sm">&gt;</span>
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection(e, "fitur")}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-50 hover:text-[#0284c7] font-bold text-sm sm:text-base transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span>Keunggulan</span>
              <span className="text-slate-400 group-hover:text-[#0284c7] font-bold text-sm">&gt;</span>
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection(e, "faq")}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-slate-50 hover:text-[#0284c7] font-bold text-sm sm:text-base transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>FAQ</span>
            </button>
          </div>
        </div>

        {/* Bagian Paling Bawah: Baru ada buttonnya */}
        <div className="p-5 border-t border-slate-100 flex flex-col gap-3 bg-white">
          {isAuthenticated ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/topik");
              }}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-center bg-[#2563eb] text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              Buka Topik Belajar
            </button>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-center text-[#ff8a1f] border-2 border-[#ff8a1f] hover:bg-[#ff8a1f] hover:text-white transition-all cursor-pointer"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-center bg-[#009bf2] text-white flex items-center justify-center gap-1.5 shadow-md hover:bg-sky-600 transition cursor-pointer"
              >
                <span>Daftar Sekarang</span>
                <span className="font-bold text-sm leading-none ml-0.5">&gt;</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* -------------------- HERO SECTION -------------------- */}
      <header
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden bg-[#1e40af] text-white pt-8 sm:pt-12 lg:pt-8 pb-0 rounded-b-[32px] sm:rounded-b-[48px] transition-colors"
      >
        {/* Background Image: classroom (background_back.png) with clearly visible opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-65 pointer-events-none scale-105"
          style={{ backgroundImage: `url(${backgroundBack})` }}
        />

        {/* Project Color Palette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1d4ed8]/85 via-[#2563eb]/75 to-[#0284c7]/65 pointer-events-none backdrop-blur-[0.5px]" />

        {/* Mint-Green Organic Accent Shape in Top-Right with interactive subtle drift */}
        <div
          style={{
            transform: `translate3d(${heroParallax.x * 0.5}px, ${heroParallax.y * 0.5}px, 0)`,
          }}
          className="absolute -top-16 -right-16 w-80 sm:w-[420px] h-52 sm:h-72 bg-[#00e5a3]/40 rounded-bl-[140px] rounded-br-[40px] blur-2xl pointer-events-none transition-transform duration-300 ease-out"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start lg:items-center">
            {/* Left Hero Content - rapi di mobile tanpa minus translate yang menabrak navbar */}
            <div className="translate-y-0 lg:-translate-y-8 lg:col-span-7 space-y-3 sm:space-y-3.5 text-center lg:text-left pt-3 sm:pt-5 lg:pt-0 pb-4 sm:pb-6 lg:pb-10 relative z-20">
              {/* Main Headline Container with Piala hovering right above headline */}
              <div className="relative inline-block max-w-lg mx-auto lg:mx-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.35rem] xl:text-[2.75rem] font-semibold leading-[1.25] tracking-tight text-white drop-shadow-md pr-0 sm:pr-4">
                  Tingkatkan{" "}
                  <span className="bg-gradient-to-r from-white via-[#ff8a1f] to-white bg-clip-text text-transparent animate-shimmer">
                    Nilai Matematika
                  </span>{" "}
                  Kamu dengan Latihan Soal untuk SD, SMP, &amp; SMA
                </h1>
                {/* Piala-komponenTambahan10.png: Tampil di desktop / tablet, di mobile disembunyikan agar teks judul bersih tanpa tertutup */}
                <img
                  src={pialaIcon}
                  alt="Piala Prestasi"
                  style={{
                    top: "-15px",
                    right: "20px",
                    transform: `translate3d(${heroParallax.x * 0.3}px, ${heroParallax.y * 0.3}px, 0)`,
                  }}
                  className="hidden sm:block absolute sm:w-16 lg:w-20 h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] animate-float-slow select-none pointer-events-none z-30 transition-transform duration-200 ease-out"
                />
              </div>

              {/* Description */}
              <p className="text-white/95 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 drop-shadow-sm font-medium">
                Bersiaplah meraih prestasi kamu bersama platform latihan
                matematika adaptif terpercaya. Ribuan variasi soal yang tak pernah
                berulang, mengasah logika dan pemahaman konsep secara bertahap.
              </p>

              {/* 2 CTA Buttons */}
              <div className="pt-0.5 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4">
                {/* Mulai Belajar */}
                <Link
                  to="/register"
                  className="w-[84%] max-w-[280px] sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#009bf2] text-white shadow-md transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#1e3a8a] hover:border-[#38bdf8]/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.9)] border-2 border-transparent text-center flex items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <span>Mulai Belajar</span>
                  <span className="font-bold text-sm leading-none ml-0.5 group-hover:translate-x-1 transition-transform">
                    &gt;
                  </span>
                </Link>

                {/* Lihat Cara Kerja */}
                <a
                  href="#cara"
                  className="w-[84%] max-w-[280px] sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-slate-800 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#ff8a1f] hover:text-white hover:border-[#ff8a1f] hover:shadow-[0_0_25px_rgba(255,138,31,0.85)] border-2 border-transparent text-center flex items-center justify-center cursor-pointer"
                >
                  Lihat Cara Kerja
                </a>
              </div>
            </div>

            {/* Right Side: Students Photo (Centered di mobile, dipertahankan posisi desktop) */}
            <div className="lg:col-span-5 flex items-end justify-center lg:justify-end self-end h-full relative z-10 pointer-events-none">
              <img
                src={siswaHero}
                alt="Siswa Siswi SD, SMP, SMA Nolla"
                style={{
                  transform: `translate3d(${-heroParallax.x * 0.4}px, ${-heroParallax.y * 0.4}px, 0)`,
                }}
                className="translate-x-0 lg:translate-x-11 mx-auto w-auto h-[320px] xs:h-[360px] sm:h-[430px] md:h-[460px] lg:h-[480px] xl:h-[530px] 2xl:h-[580px] max-w-full lg:max-w-none object-contain object-bottom align-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] select-none pointer-events-none block -mb-0.5 transition-transform duration-200 ease-out"
              />
            </div>
          </div>
        </div>

        {/* Gradien dari ujung kiri hingga kanan, tingginya setinggi bendera siswi SD */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 sm:h-24 md:h-28 lg:h-32 pointer-events-none z-15"
          style={{
            background:
              "linear-gradient(to top, #0a183d 0%, rgba(29, 78, 216, 0.75) 50%, transparent 100%)",
          }}
        />
      </header>

      {/* -------------------- STATS BAR -------------------- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-20">
        <FadeInSection variant="scale-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 border border-[#e3e6f8] hover:shadow-2xl transition-all duration-300">
            <div className="text-center p-2 group cursor-default">
              <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1 group-hover:scale-105 transition-transform">
                10.000+
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
                Bank soal beraneka ragam
              </span>
            </div>

            <div className="text-center p-2 border-l border-slate-100 group cursor-default">
              <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1 group-hover:scale-105 transition-transform">
                SD–SMA
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
                Semua jenjang sekolah
              </span>
            </div>

            <div className="text-center p-2 border-t md:border-t-0 md:border-l border-slate-100 group cursor-default">
              <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1 group-hover:scale-105 transition-transform">
                Adaptif
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
                Level otomatis via AI IRT
              </span>
            </div>

            <div className="text-center p-2 border-t md:border-t-0 border-l border-slate-100 group cursor-default">
              <span className="block text-2xl sm:text-3xl font-black text-[#2b3fd6] mb-1 group-hover:scale-105 transition-transform">
                Soal Adaptif
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#5b6088]">
                Tiap sesi baru selalu segar
              </span>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* -------------------- SECTION 1: MASALAH -------------------- */}
      <section id="masalah" className="py-20 lg:py-24 relative overflow-hidden">
        {/* Math Decorative Accents */}
        <img
          src={mathBooks}
          alt="Buku Matematika"
          className="absolute -top-2 left-2 sm:left-8 lg:left-14 w-20 sm:w-24 md:w-28 h-auto opacity-20 animate-float-slow select-none pointer-events-none drop-shadow-sm z-0"
        />
        <img
          src={mathCalculus}
          alt="Kurva Matematika"
          className="absolute -bottom-2 right-2 sm:right-8 lg:right-14 w-24 sm:w-28 md:w-32 h-auto opacity-15 animate-float-reverse select-none pointer-events-none drop-shadow-xs z-0"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeInSection>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
              Kenapa matematika terasa menakutkan?
            </h2>
            <p className="text-base sm:text-lg text-[#5b6088] max-w-2xl mx-auto mb-14">
              Rumusnya tak pernah berubah, tapi cari latihan yang lengkap dan
              beragam itu susah. Akhirnya siswa merasa terjebak dan menghindar.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
            <FadeInSection delay={0}>
              <div className="bg-white rounded-2xl p-7 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-amber-300/70 hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center cursor-default h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-115 transition-transform duration-300 shadow-2xs">
                  😨
                </div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-2 group-hover:text-amber-600 transition-colors">
                  Mindset takut
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed">
                  Matematika dicap pelajaran paling menyeramkan dari tahun ke tahun
                  karena kesalahan kecil langsung membuat nilai anjlok.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={120}>
              <div className="bg-white rounded-2xl p-7 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-blue-300/70 hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center cursor-default h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-115 transition-transform duration-300 shadow-2xs">
                  🔍
                </div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-2 group-hover:text-blue-600 transition-colors">
                  Soal susah dicari
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed">
                  Latihan di internet terbatas, sering berulang, dan tidak
                  terstruktur berdasarkan kompetensi bertingkat siswa.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={240}>
              <div className="bg-white rounded-2xl p-7 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-emerald-300/70 hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center cursor-default h-full">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-115 transition-transform duration-300 shadow-2xs">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-2 group-hover:text-emerald-600 transition-colors">
                  Nolla hadir
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed">
                  Latihan terstruktur, bertahap dari mudah hingga menantang, dan
                  terasa seru seperti bermain game puzzle interaktif.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 2: CARA KERJA -------------------- */}
      <section id="cara" className="py-20 lg:py-24 bg-[#f4f6ff] relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Math Decorative Accents */}
        <img
          src={mathLightbulb}
          alt="Ide Belajar"
          className="absolute top-8 right-4 sm:right-12 lg:right-20 w-14 sm:w-16 md:w-20 h-auto opacity-25 animate-float-slow select-none pointer-events-none drop-shadow-md z-0"
        />
        <img
          src={mathOperators}
          alt="Operasi Matematika"
          className="absolute bottom-8 left-4 sm:left-12 lg:left-20 w-12 sm:w-14 md:w-16 h-auto opacity-20 animate-float-reverse select-none pointer-events-none drop-shadow-xs z-0"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeInSection>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
              3 langkah meningkatkan kemampuan
            </h2>
            <p className="text-base text-[#5b6088] max-w-xl mx-auto mb-14">
              Metode belajar santai tapi terbukti ampuh membentuk pemahaman intuitif
              yang melekat.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center relative">
            <FadeInSection delay={0}>
              <div className="bg-white rounded-2xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center group cursor-default h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2b3fd6]/0 to-transparent group-hover:via-[#2b3fd6] transition-all duration-500" />
                <div className="w-12 h-12 rounded-xl bg-[#2b3fd6]/10 text-[#2b3fd6] flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                  1️⃣
                </div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-3 group-hover:text-[#2b3fd6] transition-colors">
                  Pilih jenjang &amp; topik
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed">
                  Tersedia untuk jenjang SD, SMP, hingga SMA. Mulai langsung dari topik
                  yang ingin kamu kuasai hari ini.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={120}>
              <div className="bg-white rounded-2xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-[#ff8a1f]/40 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center group cursor-default h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ff8a1f]/0 to-transparent group-hover:via-[#ff8a1f] transition-all duration-500" />
                <div className="w-12 h-12 rounded-xl bg-[#ff8a1f]/15 text-[#ff8a1f] flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                  2️⃣
                </div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-3 group-hover:text-[#ff8a1f] transition-colors">
                  Drill soal adaptif
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed">
                  Terlalu mudah? Tingkat kesulitan otomatis naik. Merasa kesulitan? Sistem
                  akan turun sedikit untuk memperkuat pemahaman dasar.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={240}>
              <div className="bg-white rounded-2xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center group cursor-default h-full">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500 transition-all duration-500" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                  3️⃣
                </div>
                <h3 className="text-xl font-bold text-[#1b1f3b] mb-3 group-hover:text-emerald-600 transition-colors">
                  Naik level &amp; pantau
                </h3>
                <p className="text-sm text-[#5b6088] leading-relaxed">
                  Dapatkan XP harian, pertahankan streak latihan, buka badge kehormatan,
                  dan lihat grafik perkembangan kemampuanmu.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 3: JENJANG -------------------- */}
      <section id="jenjang" className="py-20 lg:py-24 relative overflow-hidden">
        {/* Floating Math Decor - DKV Balanced */}
        <img
          src={mathGeometry}
          alt=""
          aria-hidden="true"
          className="absolute top-10 left-3 sm:left-8 w-14 sm:w-20 md:w-24 h-auto object-contain opacity-25 animate-float-slow pointer-events-none select-none drop-shadow-sm z-0"
        />
        <img
          src={mathNumberTower}
          alt=""
          aria-hidden="true"
          className="absolute bottom-8 right-4 sm:right-10 w-10 sm:w-14 md:w-16 h-auto object-contain opacity-25 animate-float-reverse pointer-events-none select-none drop-shadow-sm z-0"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeInSection>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
              Belajar Sesuai Jenjangmu
            </h2>
            <p className="text-base text-[#5b6088] max-w-xl mx-auto mb-14">
              Setiap jenjang memiliki kurikulum dan tantangan yang disesuaikan dengan
              tahap perkembangan kognitif siswa.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* SD */}
            <FadeInSection delay={0} variant="scale-up">
              <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-2xl hover:border-amber-400/50 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between items-center text-center group cursor-default h-full">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center overflow-hidden p-2 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 mx-auto mb-5 shadow-xs">
                    <img
                      src={sdIcon}
                      alt="Jenjang SD"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-800 mb-3 mx-auto">
                    Kelas 1 - 6
                  </div>
                  <h3 className="text-2xl font-bold text-[#1b1f3b] mb-2 group-hover:text-amber-700 transition-colors">
                    Sekolah Dasar (SD)
                  </h3>
                  <p className="text-sm text-[#5b6088] leading-relaxed mb-6">
                    Berhitung dasar, pecahan, persentase, bangun datar, dan fondasi
                    logika matematika yang menyenangkan.
                  </p>
                </div>
                {/* <Link
                  to={isAuthenticated ? "/topik" : "/register"}
                  className="w-full max-w-xs inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white hover:shadow-lg transition-all text-center group/btn"
                >
                  <span>Lihat Topik SD</span>
                  <span className="font-bold text-base leading-none group-hover/btn:translate-x-1 transition-transform">&gt;</span>
                </Link> */}
              </div>
            </FadeInSection>

            {/* SMP */}
            <FadeInSection delay={120} variant="scale-up">
              <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-2xl hover:border-blue-400/50 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between items-center text-center group cursor-default h-full">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden p-2 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 mx-auto mb-5 shadow-xs">
                    <img
                      src={smpIcon}
                      alt="Jenjang SMP"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-blue-800 mb-3 mx-auto">
                    Kelas 7 - 9
                  </div>
                  <h3 className="text-2xl font-bold text-[#1b1f3b] mb-2 group-hover:text-blue-700 transition-colors">
                    Sekolah Menengah Pertama (SMP)
                  </h3>
                  <p className="text-sm text-[#5b6088] leading-relaxed mb-6">
                    Aljabar persamaan linier, relasi dan fungsi, geometri ruang,
                    teorema Pythagoras, dan statistika dasar.
                  </p>
                </div>
                {/* <Link
                  to={isAuthenticated ? "/topik" : "/register"}
                  className="w-full max-w-xs inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white hover:shadow-lg transition-all text-center group/btn"
                >
                  <span>Lihat Topik SMP</span>
                  <span className="font-bold text-base leading-none group-hover/btn:translate-x-1 transition-transform">&gt;</span>
                </Link> */}
              </div>
            </FadeInSection>

            {/* SMA */}
            <FadeInSection delay={240} variant="scale-up">
              <div className="bg-white rounded-3xl p-8 border border-[#e3e6f8] shadow-sm hover:shadow-2xl hover:border-indigo-400/50 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between items-center text-center group cursor-default h-full">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden p-2 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 mx-auto mb-5 shadow-xs">
                    <img
                      src={smaIcon}
                      alt="Jenjang SMA"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100/70 text-indigo-800 mb-3 mx-auto">
                    Kelas 10 - 12
                  </div>
                  <h3 className="text-2xl font-bold text-[#1b1f3b] mb-2 group-hover:text-indigo-700 transition-colors">
                    Sekolah Menengah Atas (SMA)
                  </h3>
                  <p className="text-sm text-[#5b6088] leading-relaxed mb-6">
                    Fungsi kuadrat, trigonometri lanjut, kalkulus limit &amp; turunan,
                    matriks, dan teori peluang kombinatorika.
                  </p>
                </div>
                {/* <Link
                  to={isAuthenticated ? "/topik" : "/register"}
                  className="w-full max-w-xs inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full font-bold text-sm text-[#2b3fd6] border-2 border-[#2b3fd6] hover:bg-[#2b3fd6] hover:text-white hover:shadow-lg transition-all text-center group/btn"
                >
                  <span>Lihat Topik SMA</span>
                  <span className="font-bold text-base leading-none group-hover/btn:translate-x-1 transition-transform">&gt;</span>
                </Link> */}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 4: KEUNGGULAN -------------------- */}
      <section id="fitur" className="py-20 lg:py-24 bg-[#f4f6ff] relative overflow-hidden">
        {/* Floating Math Decor - DKV Balanced */}
        <img
          src={mathSigma}
          alt=""
          aria-hidden="true"
          className="absolute top-8 left-4 sm:left-10 w-12 sm:w-16 md:w-20 h-auto object-contain opacity-25 animate-float-slow pointer-events-none select-none drop-shadow-sm z-0"
        />
        <img
          src={mathCalculus}
          alt=""
          aria-hidden="true"
          className="absolute bottom-6 right-4 sm:right-10 w-20 sm:w-28 md:w-32 h-auto object-contain opacity-20 animate-float-reverse pointer-events-none select-none drop-shadow-xs z-0"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1f3b] mb-4">
              Skill drill, bukan sekadar ujian
            </h2>
            <p className="text-base text-[#5b6088] max-w-xl mx-auto">
              Perbedaan mendasar antara menghafal formula ujian vs melatih
              keterampilan hingga menjadi insting alami.
            </p>
          </FadeInSection>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FadeInSection delay={0}>
              <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center group cursor-default h-full">
                <div className="text-3xl mb-4 group-hover:scale-115 transition-transform duration-300">🎚️</div>
                <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5 group-hover:text-primary transition-colors">Adaptif</h3>
                <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                  Tingkat kesulitan mengikuti kondisi dan kemampuan pemahaman kamu
                  secara dinamis.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={100}>
              <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center group cursor-default h-full">
                <div className="text-3xl mb-4 group-hover:scale-115 transition-transform duration-300">♾️</div>
                <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5 group-hover:text-primary transition-colors">
                  Soal tak berulang
                </h3>
                <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                  Latihan sebanyak apa pun, variasinya selalu segar sehingga melatih
                  logika sebenarnya.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={200}>
              <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center group cursor-default h-full">
                <div className="text-3xl mb-4 group-hover:scale-115 transition-transform duration-300">🏆</div>
                <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5 group-hover:text-primary transition-colors">
                  Gamifikasi
                </h3>
                <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                  Level, streak harian, dan badge prestasi yang membangkitkan rasa
                  percaya diri belajar.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={300}>
              <div className="bg-white rounded-2xl p-6 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center group cursor-default h-full">
                <div className="text-3xl mb-4 group-hover:scale-115 transition-transform duration-300">🧠</div>
                <h3 className="text-lg font-bold text-[#1b1f3b] mb-1.5 group-hover:text-primary transition-colors">
                  Soal tervalidasi AI
                </h3>
                <p className="text-xs sm:text-sm text-[#5b6088] leading-relaxed">
                  Diklasifikasi IndoBERT, diverifikasi LLM, dan dikalibrasi akurat
                  dengan Item Response Theory (IRT).
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 5: TESTIMONI (HORIZONTAL TICKER) - DI-HIDE SEMENTARA -------------------- */}
      {/* Catatan: Section ini disembunyikan dari tampilan layar (hidden) tanpa menghapus kodenya */}
      <section
        id="testimoni"
        className="hidden pt-16 sm:pt-20 lg:pt-20 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white"
        onMouseEnter={handleMouseEnterTestimonial}
        onMouseLeave={handleMouseLeaveTestimonial}
        onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
      >
          {/* Floating Math Decor - DKV Balanced */}
          <img
            src={mathPi}
            alt=""
            aria-hidden="true"
            className="absolute top-6 left-4 sm:left-10 w-10 sm:w-14 md:w-16 h-auto object-contain opacity-25 animate-float-slow pointer-events-none select-none drop-shadow-sm z-0"
          />
          <img
            src={mathLightbulb}
            alt=""
            aria-hidden="true"
            className="absolute top-6 right-4 sm:right-10 w-12 sm:w-16 md:w-18 h-auto object-contain opacity-20 animate-float-reverse pointer-events-none select-none drop-shadow-sm z-0"
          />
          <FadeInSection className="max-w-6xl mx-auto px-4 sm:px-6 text-center mb-8 sm:mb-10 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1b1f3b] tracking-tight mb-3">
              Apa kata mereka tentang Nolla?
            </h2>
            <p className="text-base text-[#5b6088] max-w-xl mx-auto">
              Cerita nyata dari ribuan pelajar &amp; pendidik yang mengubah rasa takut matematika menjadi rasa percaya diri.
            </p>
          </FadeInSection>

          {/* Horizontal Ticker with Gradient Fade Edges */}
          <FadeInSection delay={150}>
            <div className="relative w-full overflow-hidden group py-3">
              {/* Left & Right Gradient Shadows for seamless entry/exit */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-36 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-36 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

              {/* Marquee Track */}
              <div className="flex gap-6 animate-marquee">
                {[...testimonials, ...testimonials].map((item, idx) => (
                  <div
                    key={idx}
                    className="w-[300px] sm:w-[370px] shrink-0 bg-white rounded-3xl p-6 sm:p-7 border border-[#e3e6f8] shadow-sm hover:shadow-xl hover:border-[#2b3fd6]/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between select-none cursor-default"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex gap-1 text-amber-400 text-sm">
                          {"★".repeat(item.rating)}
                        </div>
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {item.tag}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1b1f3b] mb-2 flex items-center gap-1.5">
                        <span>✨</span>
                        <span>{item.highlight}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-5">
                        “{item.text}”
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100">
                      <div
                        className={`w-10 h-10 rounded-full ${item.avatarBg} font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                      >
                        {item.initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-xs sm:text-sm text-[#1b1f3b] truncate">
                            {item.name}
                          </h5>
                          <span className="text-emerald-500 font-bold text-xs" title="Terverifikasi">
                            ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5b6088] truncate">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          {/* Dynamic Cursor Tooltip Notification (Muncul 3 detik saja saat memasuki section) */}
          {showTestimonialHint && (
            <div
              className="pointer-events-none fixed z-50 px-3.5 py-1.5 rounded-full bg-[#1b1f3b]/95 backdrop-blur-md text-white text-xs font-medium shadow-2xl border border-white/20 flex items-center gap-2 select-none transition-opacity duration-300 ease-out whitespace-nowrap animate-in fade-in"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                transform: "translate(-50%, -140%)",
              }}
            >
              <span className="text-amber-400 text-sm">👆</span>
              <span>Arahkan kursor ke kartu untuk menjeda</span>
            </div>
          )}
        </section>

      {/* -------------------- SECTION 6: FAQ -------------------- */}
      <section id="faq" className="pt-14 sm:pt-16 lg:pt-20 pb-0 relative overflow-hidden bg-[#f4f9ff]">
        {/* Floating Math Decor - DKV Balanced */}
        <img
          src={mathBooks}
          alt=""
          aria-hidden="true"
          className="absolute top-6 left-4 sm:left-10 w-16 sm:w-20 md:w-24 h-auto object-contain opacity-20 animate-float-slow pointer-events-none select-none drop-shadow-sm z-0"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            {/* Left: Title & FAQ Accordion (diatas list pertanyaan seperti semula) */}
            <div className="lg:col-span-8 pb-10 sm:pb-12 lg:pb-14">
              <FadeInSection className="text-center lg:text-left mb-6 sm:mb-7">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1b1f3b] mb-3">
                  Pertanyaan umum
                </h2>
                <p className="text-base text-[#5b6088]">
                  Semua hal yang perlu kamu ketahui tentang cara belajar di Nolla.
                </p>
              </FadeInSection>

              <FadeInSection delay={120}>
                <div className="space-y-4">
                  {faqList.map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div
                        key={index}
                        ref={(el) => (faqItemRefs.current[index] = el)}
                        className={`rounded-2xl overflow-hidden transition-all duration-300 shadow-md ${isOpen
                          ? "bg-gradient-to-r from-[#ff851b] to-[#ff5745] ring-4 ring-[#ff8a1f]/25 shadow-xl scale-[1.01]"
                          : "bg-gradient-to-r from-[#ff8a1f] to-[#ff6538] hover:shadow-lg hover:scale-[1.005]"
                          }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(index)}
                          className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-bold text-base text-white transition-colors cursor-pointer select-none"
                        >
                          <span className="leading-snug drop-shadow-xs">{item.q}</span>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen
                              ? "bg-white text-[#ff8a1f] shadow-md"
                              : "bg-white/20 text-white hover:bg-white hover:text-[#ff8a1f]"
                              }`}
                          >
                            {isOpen ? (
                              <Minus size={18} className="stroke-[2.5]" />
                            ) : (
                              <Plus size={18} className="stroke-[2.5]" />
                            )}
                          </div>
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                            }`}
                        >
                          <div className="overflow-hidden">
                            <div className="px-6 pb-5 pt-1">
                              <div className="bg-black/10 backdrop-blur-xs rounded-xl p-4 text-sm text-white/95 leading-relaxed border border-white/15 shadow-inner">
                                {item.a}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FadeInSection>
            </div>

            {/* Right: Siswa Menunjuk touching the start of CTA orange frame & larger size */}
            <div className="lg:col-span-4 hidden lg:flex items-end justify-center lg:justify-end self-end -mb-1">
              <FadeInSection delay={180}>
                <img
                  src={siswaMenunjuk}
                  alt="Siswa Menunjuk FAQ"
                  className="w-auto h-[530px] xl:h-[590px] object-contain object-bottom align-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.18)] select-none pointer-events-none block -mb-1"
                />
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SECTION 7: CTA SECTION -------------------- */}
      <section
        id="cta"
        className="relative py-16 sm:py-20 lg:py-20 bg-gradient-to-r from-[#ff8a1f] to-[#ff5d5d] text-white overflow-visible"
      >
        {/* Ambient Pulsing Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-amber-400/25 blur-3xl rounded-full pointer-events-none animate-pulse-glow" />

        {/* Floating 3D Math Elements in Background */}
        <img
          src={mathPi}
          alt="Pi"
          className="absolute top-4 right-20 sm:right-28 w-14 sm:w-16 h-auto opacity-35 animate-float-slow select-none pointer-events-none drop-shadow-md"
        />
        <img
          src={mathSigma}
          alt="Sigma"
          className="absolute bottom-4 right-10 sm:right-16 w-14 sm:w-16 h-auto opacity-35 animate-float-reverse select-none pointer-events-none drop-shadow-md"
        />
        <img
          src={mathOperators}
          alt="Operasi"
          className="absolute top-1/2 -translate-y-1/2 right-1/3 w-12 sm:w-14 h-auto opacity-25 select-none pointer-events-none"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          {/* Siswa SD Overlay: Tidak di-grup dengan tinggi section (overlay menembus ke atas frame) */}
          <div className="hidden lg:block absolute -bottom-16 sm:-bottom-20 left-0 xl:left-2 z-20 pointer-events-none select-none">
            <img
              src={siswaSd}
              alt="Siswa SD Nolla"
              className="w-auto h-[450px] xl:h-[490px] object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Desktop spacer untuk siswa-sd */}
            <div className="hidden lg:block lg:col-span-4" />

            {/* Right: Text Content & Action Buttons */}
            <div className="lg:col-span-8 text-center lg:text-left relative z-20 lg:pl-3 xl:pl-5">
              <FadeInSection>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3 sm:mb-4 max-w-2xl mx-auto lg:mx-0">
                  Siap ubah “takut” jadi “bisa”?
                </h2>
                <p className="text-sm sm:text-xl text-white/95 max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8 font-medium">
                  Daftar sekarang dan mulai sesi drill pertamamu dalam hitungan detik.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <Link
                    to="/register"
                    className="w-[84%] max-w-[280px] sm:w-auto sm:max-w-none whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full font-black text-sm sm:text-base bg-white text-[#ff8a1f] hover:bg-slate-100 shadow-xl shadow-black/15 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Daftar Sekarang</span>
                    <span className="font-bold text-base leading-none group-hover:translate-x-1 transition-transform">
                      &gt;
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    className="w-[84%] max-w-[280px] sm:w-auto sm:max-w-none whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full font-bold text-sm sm:text-base bg-white/10 hover:bg-white/20 text-white border-2 border-white/50 hover:border-white transition-all text-center cursor-pointer"
                  >
                    Sudah Punya Akun? Masuk
                  </Link>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-[#0b1739] text-slate-300 pt-10 sm:pt-14 pb-0 text-sm border-t border-[#1e2e5c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid Layout: 2 Kolom di Mobile, 5 Kolom di Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 sm:gap-x-8 gap-y-8 lg:gap-8 mb-10">
            {/* Col 1: Brand & Socials (Full width 2 kolom di mobile, 1 kolom di desktop) */}
            <div className="col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-block bg-white px-3 py-1.5 rounded-xl shadow-sm mb-4 cursor-pointer hover:opacity-90 transition-opacity border-0"
                title="Kembali ke atas"
              >
                <img src={logoNolla} alt="NOLLA" className="h-7 w-auto object-contain" />
              </button>
              <p className="text-slate-400 text-xs leading-relaxed mb-5 max-w-sm lg:max-w-xs">
                Skill drill matematika adaptif untuk siswa SD–SMA. Melatih intuisi
                dan keterampilan berhitung secara bertahap dan menyenangkan.
              </p>
              {/* Authentic App Icons for Instagram, TikTok, YouTube */}
              <div className="flex items-center gap-2.5">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/celestiall24?"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram Nolla"
                  className="w-9 h-9 rounded-full border border-slate-600/70 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:border-pink-500 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 shadow-sm transition-all duration-300 group cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@celestiall.24?"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  title="TikTok Nolla"
                  className="w-9 h-9 rounded-full border border-slate-600/70 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 hover:bg-[#000000] shadow-sm transition-all duration-300 group cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.76 1.42-.03 2.67-.97 3.03-2.34.19-.61.24-1.25.24-1.89l.01-17.43z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://www.youtube.com/@FakultasTeknikUM"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  title="YouTube Nolla"
                  className="w-9 h-9 rounded-full border border-slate-600/70 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:border-red-500 hover:bg-[#ff0000] shadow-sm transition-all duration-300 group cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Baris 1 di Mobile: Quick Links (Kiri) */}
            <div className="col-span-1">
              <h4 className="font-bold text-white mb-3 text-xs sm:text-sm uppercase tracking-wider">
                QUICK LINKS
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a
                    href="#masalah"
                    onClick={(e) => scrollToSection(e, "masalah")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Kenapa Nolla
                  </a>
                </li>
                <li>
                  <a
                    href="#cara"
                    onClick={(e) => scrollToSection(e, "cara")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Cara Kerja
                  </a>
                </li>
                <li>
                  <a
                    href="#jenjang"
                    onClick={(e) => scrollToSection(e, "jenjang")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Jenjang SD–SMA
                  </a>
                </li>
                            <li>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, "faq")}
                className="hover:text-[#0284c7] transition-colors cursor-pointer"
              >
                FAQ
              </a>
            </li>
              </ul>
            </div>

            {/* Baris 1 di Mobile: Resources (Kanan) */}
            <div className="col-span-1">
              <h4 className="font-bold text-white mb-3 text-xs sm:text-sm uppercase tracking-wider">
                RESOURCES
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a
                    href="https://buku.kemendikdasmen.go.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    SIBI (Sistem Informasi Perbukuan Indonesia)
                  </a>
                </li>
              </ul>
            </div>

            {/* Baris 2 di Mobile: Contact Us (Kiri) */}
            <div className="col-span-1">
              <h4 className="font-bold text-white mb-3 text-xs sm:text-sm uppercase tracking-wider">
                CONTACT US
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="text-[#ff8a1f] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Jalan Semarang No. 5, Sumbersari, Kecamatan Lowokwaru, Kota Malang, Jawa Timur 65145<br />
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={15} className="text-[#ff8a1f] shrink-0" />
                  <a href="tel:+15551234567" className="hover:text-white transition-colors truncate">
                    (0341) 551312
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={15} className="text-[#ff8a1f] shrink-0" />
                  <a href="mailto:info@brightfuture.edu" className="hover:text-white transition-colors break-all">
                    qa.nolla.akun01@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Baris 2 di Mobile: Newsletter (Kanan) */}
            <div className="col-span-1">
              <h4 className="font-bold text-white mb-3 text-xs sm:text-sm uppercase tracking-wider">
                NEWSLETTER
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Dapatkan informasi terkini mengenai berita dan acara kami.
              </p>
              {/* <form onSubmit={handleNewsletterSubmit} className="flex items-center w-full rounded-md overflow-hidden bg-white shadow-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2.5 outline-none placeholder:text-slate-400 min-w-0"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#ff8a1f] hover:bg-[#ff7605] active:bg-[#e06800] text-white px-3 py-2.5 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Kirim"
                  aria-label="Subscribe Newsletter"
                >
                  <ArrowRight size={16} className="stroke-[2.5]" />
                </button>
              </form> */}
              {newsletterStatus === "success" && (
                <p className="text-[11px] text-emerald-400 mt-2 font-medium animate-in fade-in">
                  ✓ Terima kasih sudah berlangganan!
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#1e2e5c] py-3 text-center text-xs text-slate-400/80 leading-tight">
            © 2026 NOLLA. Proyek Big Data 2026. Hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
