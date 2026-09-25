import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Award,
  X,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import TopHeader from "../components/TopHeader";
import {
  allChapters,
  allGrades,
  chaptersByLevel,
  gradeFiltersByLevel,
  educationLevels,
} from "../data/topicsData";

// Smooth Scroll helper
const smoothScrollToElement = (element, offsetMargin = 16, duration = 800) => {
  if (!element) return;
  const topHeaderEl = document.getElementById("top-header-section");
  const headerHeight = topHeaderEl ? topHeaderEl.offsetHeight : 80;

  const rect = element.getBoundingClientRect();
  const elementTop = rect.top + window.pageYOffset;
  const targetY = elementTop - headerHeight - offsetMargin;

  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const difference = targetY - startY;

  if (Math.abs(difference) < 5) return;

  const startTime = performance.now();
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + difference * easeProgress);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

const Topics = () => {
  // Jenjang dibaca murni dari setting (localStorage). Tidak dapat diubah di filter biasa.
  const userSettingLevel = useMemo(() => {
    const saved = localStorage.getItem("user_education_level");
    return saved && educationLevels[saved] ? saved : (saved === "Semua" ? "Semua" : "SMP");
  }, []);

  // Filter & Search states (iOS theme: Hanya 1 tindakan yaitu Filter Kelas)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Semua Kelas");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  // Chapters Data sesuai jenjang yang aktif di setting
  const activeLevelChapters = useMemo(() => {
    if (userSettingLevel === "Semua") {
      return allChapters;
    }
    return chaptersByLevel[userSettingLevel] || chaptersByLevel.SMP;
  }, [userSettingLevel]);

  // Daftar opsi filter kelas murni berdasarkan jenjang di setting
  const availableGradeFilters = useMemo(() => {
    if (userSettingLevel === "Semua") {
      return allGrades;
    }
    return gradeFiltersByLevel[userSettingLevel] || gradeFiltersByLevel.SMP;
  }, [userSettingLevel]);

  // Chapters State
  const [chaptersData, setChaptersData] = useState(() => activeLevelChapters);

  // Update jika activeLevelChapters berubah
  useEffect(() => {
    setChaptersData(activeLevelChapters);
  }, [activeLevelChapters]);

  // State accordion: Set of chapter IDs yang sedang expanded
  const [expandedChapters, setExpandedChapters] = useState(() => {
    const firstChapter = activeLevelChapters[0];
    return new Set([firstChapter?._id || firstChapter?.id || ""]);
  });

  // State Modal Hasil Pretest
  const [activePretestResult, setActivePretestResult] = useState(null);

  // State Modal Konfirmasi / Mulai Pretest
  const [pretestConfirmChapter, setPretestConfirmChapter] = useState(null);

  // State Modal Peringatan Prasyarat
  const [prerequisiteModal, setPrerequisiteModal] = useState(null);

  // Chapters yang telah diizinkan user untuk dibuka meski belum selesai prasyarat
  const [bypassedChapterPrerequisites, setBypassedChapterPrerequisites] = useState(
    new Set()
  );

  // Tutup dropdown filter kelas ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle buka/tutup accordion BAB
  const toggleChapter = (chapter) => {
    const chapterKey = chapter._id || chapter.id;
    const isCurrentlyExpanded = expandedChapters.has(chapterKey);

    // Jika ingin membuka dan BAB memiliki prasyarat yang belum selesai dan belum di-bypass
    if (
      !isCurrentlyExpanded &&
      chapter.hasPrerequisite &&
      !chapter.prerequisiteCompleted &&
      !bypassedChapterPrerequisites.has(chapterKey)
    ) {
      setPrerequisiteModal({
        type: "chapter",
        chapter,
        prerequisiteName: chapter.prerequisiteName,
      });
      return;
    }

    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterKey)) {
        next.delete(chapterKey);
      } else {
        next.add(chapterKey);
      }
      return next;
    });

    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        const cardElement = document.getElementById(`chapter-card-${chapterKey}`);
        if (cardElement) {
          smoothScrollToElement(cardElement, 16, 750);
        }
      }, 50);
    }
  };

  // Expand semua bab jika user sedang mencari kata kunci
  const isSearching = searchQuery.trim().length > 0;

  // Filtering Chapters & Subtopics berdasarkan Search dan Filter Kelas (sesuai setting)
  const filteredChapters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return chaptersData
      .map((chapter) => {
        const chapterNameMatches =
          chapter.name.toLowerCase().includes(query) ||
          chapter.description.toLowerCase().includes(query);

        const chapterSubbab = chapter.subbab || chapter.subtopics || [];
        const matchingSubbab = chapterSubbab.filter((sub) => {
          const matchesGrade =
            selectedGrade === "Semua Kelas" ||
            sub.classReference.toLowerCase() === selectedGrade.toLowerCase();

          if (!matchesGrade) return false;
          if (!query) return true;

          const subNameMatches =
            sub.name.toLowerCase().includes(query) ||
            (sub.description && sub.description.toLowerCase().includes(query));
          return subNameMatches || chapterNameMatches;
        });

        const hasMatchingSubbab = matchingSubbab.length > 0;

        return {
          ...chapter,
          subbab: chapterSubbab,
          filteredSubbab: matchingSubbab,
          filteredSubtopics: matchingSubbab,
          isMatch: hasMatchingSubbab,
        };
      })
      .filter((chapter) => chapter.isMatch);
  }, [chaptersData, searchQuery, selectedGrade]);

  // Eksekusi penyelesaian Pretest
  const executeCompletePretest = (chapter) => {
    const simulatedScore = 85;
    const correct = Math.round((simulatedScore / 100) * 15);
    const wrong = 15 - correct;
    const newResult = {
      score: simulatedScore,
      correctCount: correct,
      wrongCount: wrong,
      duration: "14 Menit 20 Detik",
      breakdown: (chapter.subbab || chapter.subtopics || []).map((s, idx) => ({
        subtopic: s.name,
        status: idx % 2 === 0 ? "Kuasai" : "Perlu Latihan",
        score: idx % 2 === 0 ? "90%" : "65%",
      })),
      recommendation: `Berdasarkan hasil pretest diagnostik, kamu siap mempelajari materi bab ${chapter.name}. Direkomendasikan memulai dari subbab pertama untuk memperkuat fondasi konsep.`,
    };

    const chapterKey = chapter._id || chapter.id;

    // Update data state bab
    setChaptersData((prev) =>
      prev.map((c) =>
        (c._id || c.id) === chapterKey
          ? { ...c, diagnosticStatus: "completed", pretestResult: newResult }
          : c
      )
    );

    chapter.diagnosticStatus = "completed";
    chapter.pretestResult = newResult;

    // Buka accordion BAB jika belum terbuka
    setExpandedChapters((prev) => new Set(prev).add(chapterKey));

    // Buka dialog ringkasan hasil
    setActivePretestResult({
      chapterName: chapter.name,
      result: newResult,
    });
  };

  // Handler klik aksi subbab
  const handleSubtopicAction = (subtopic, chapter) => {
    if (subtopic.status === "needs_prerequisite") {
      setPrerequisiteModal({
        type: "subtopic",
        subtopic,
        chapter,
        prerequisiteName: subtopic.prerequisiteName,
      });
      return;
    }

    console.log(`Memulai pembelajaran subbab: ${subtopic.name} (${subtopic._id || subtopic.id})`);
  };

  // Menentukan badge & tombol aksi subbab berdasarkan statusnya (TANPA PROGRESS BAR)
  const renderSubtopicStatusAndAction = (subtopic) => {
    switch (subtopic.status) {
      case "completed":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Selesai
            </span>
          ),
          buttonText: "Pelajari Lagi",
          buttonClass:
            "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200",
        };
      case "in_progress":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-primary border border-blue-100">
              Sedang Dipelajari
            </span>
          ),
          buttonText: "Lanjutkan",
          buttonClass:
            "bg-primary hover:bg-primary-hover text-white shadow-xs font-semibold",
        };
      case "needs_prerequisite":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Prasyarat Disarankan
            </span>
          ),
          buttonText: "Mulai Belajar",
          buttonClass:
            "bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-semibold",
        };
      case "not_started":
      default:
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Belum Dimulai
            </span>
          ),
          buttonText: "Mulai Belajar",
          buttonClass:
            "bg-white hover:bg-slate-50 text-primary border border-primary/30 hover:border-primary font-semibold",
        };
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Sidebar Navigation */}
      <Navbar activePage="Topik" />

      {/* Main Content Column: Header menempel ke batas atas, sidebar (kiri), dan batas kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 1. HEADER PENGGANTI TOP HEADER (Menyatu batas atas, kiri/sidebar, dan kanan) */}
        <TopHeader />

        {/* 2. AREA KONTEN (Search Bar, Filters, dan Card Bab) */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full pb-24 md:pb-8">
          {/* SEARCH BAR & FILTERS (Gaya iOS: Persegi Tumpul Sejajar, Filter hanya 1 tindakan yaitu Filter Kelas) */}
          <div className="flex items-center gap-3 mb-6">
            {/* Bentuk 1: Search Bar iOS Pill */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bab atau topik pembelajaran..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bentuk 2: Filters Button iOS Pill (Hanya 1 tindakan: Filter Kelas sesuai setting) */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`bg-white border rounded-2xl px-4 sm:px-5 py-3 flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs select-none ${
                  isFilterOpen || selectedGrade !== "Semua Kelas"
                    ? "border-primary text-primary bg-blue-50/40 ring-1 ring-primary/20"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                title="Filter materi berdasarkan kelas"
              >
                <span>
                  {selectedGrade !== "Semua Kelas"
                    ? `Filters: ${selectedGrade}`
                    : "Filters"}
                </span>
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                {selectedGrade !== "Semua Kelas" && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              {/* Popover Dropdown Pilihan Filter Kelas (1 Tindakan Saja Sesuai Setting) */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-30 animate-in fade-in zoom-in-95 max-h-[80vh] overflow-y-auto">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 mb-1">
                    Filter Berdasarkan Kelas
                  </div>

                  <div className="space-y-1">
                    {availableGradeFilters.map((grade) => {
                      const isSelected = selectedGrade === grade;
                      return (
                        <button
                          key={grade}
                          onClick={() => {
                            setSelectedGrade(grade);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white font-semibold shadow-2xs"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>
                            {grade === "Semua Kelas" ? `${grade} (Default)` : grade}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedGrade !== "Semua Kelas" && (
                    <div className="pt-2 mt-2 border-t border-slate-100 px-1">
                      <button
                        onClick={() => {
                          setSelectedGrade("Semua Kelas");
                          setIsFilterOpen(false);
                        }}
                        className="w-full text-center py-1.5 text-[11px] font-medium text-slate-500 hover:text-primary flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kembalikan ke Default</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. DAFTAR CARD BAB (Tanpa Icon, Mengikuti Format Human-Centered Design Basics) */}
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Tidak ada BAB yang cocok
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Coba sesuaikan kata kunci pencarian atau ganti filter kelas untuk menemukan materi pelajaran.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGrade("Semua Kelas");
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Reset Filter & Pencarian
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredChapters.map((chapter) => {
                const chapterKey = chapter._id || chapter.id;
                const isExpanded = isSearching || expandedChapters.has(chapterKey);
                const isPretestCompleted = chapter.diagnosticStatus === "completed";

                // Perhitungan progress BAB: Jika belum pretest, maka progress di bab belum ada (0% / 0 of X)
                const chapterSubbabList = chapter.subbab || chapter.subtopics || [];
                const totalLessons = chapterSubbabList.length;
                const completedLessons = isPretestCompleted
                  ? chapterSubbabList.filter((s) => s.status === "completed").length
                  : 0;
                const progressPercentage =
                  isPretestCompleted && totalLessons > 0
                    ? Math.round((completedLessons / totalLessons) * 100)
                    : 0;

                return (
                  <article
                    id={`chapter-card-${chapterKey}`}
                    key={chapterKey}
                    className={`bg-white border rounded-3xl transition-all duration-300 shadow-xs overflow-hidden ${
                      isExpanded
                        ? "border-primary/40 ring-1 ring-primary/10 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* CARD BAB HEADER (Tanpa icon sama sekali sesuai instruksi) */}
                    <div className="p-5 sm:p-6">
                      {/* Baris Kategori / Tag BAB */}
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        BAB {chapter.display_order || 1} • {chapter.educationLevel || "MATEMATIKA"}
                      </div>

                      {/* Judul BAB */}
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mb-1">
                        {chapter.name}
                      </h2>

                      {/* Deskripsi Singkat BAB dari DB */}
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                        {chapter.description}
                      </p>

                      {/* Progress Section (Format: X of Y lessons completed dengan Progress Bar Oranye) */}
                      <div className="mb-5">
                        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>
                            {completedLessons} of {totalLessons} lessons completed
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f97316] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Row: Metadata & Tombol Kondisional */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-3">
                        <div className="text-[11px] font-medium text-slate-400">
                          {chapter.classRange || "Kurikulum Nasional"}
                        </div>

                        {/* BUTTON KONDISIONAL BERDASARKAN STATUS PRETEST */}
                        <div>
                          {!isPretestCompleted ? (
                            <button
                              onClick={() => setPretestConfirmChapter(chapter)}
                              className="bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer hover:shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Mulai Pretest</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleChapter(chapter)}
                              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                                isExpanded
                                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                              }`}
                              aria-expanded={isExpanded}
                            >
                              <span>{isExpanded ? "Tutup Sub Bab" : "Lihat Sub Bab"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DROPDOWN ISI BAB (Hanya Card Pretest dan Daftar Sub Bab, Tanpa Langkah 1/2, Tanpa Post Test) */}
                    {isExpanded && isPretestCompleted && (
                      <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6 space-y-4 animate-in fade-in duration-300">
                        
                        {/* 1. CARD PRETEST (PALING ATAS, BISA DILIHAT KEMBALI KAPAN SAJA) */}
                        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-bold text-slate-900">
                                Diagnostic Pretest: {chapter.name}
                              </h4>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Selesai • Skor: {chapter.pretestResult?.score || 85}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Hasil pretest tersimpan. Kamu dapat meninjau analisis penguasaan materi dan rekomendasi belajar kapan saja.
                            </p>
                          </div>

                          <div className="shrink-0 self-end sm:self-center">
                            <button
                              onClick={() =>
                                setActivePretestResult({
                                  chapterName: chapter.name,
                                  result: chapter.pretestResult,
                                })
                              }
                              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Lihat Hasil Pretest</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. DAFTAR SUB BAB (BERDASARKAN TABEL DB SUBBAB, TANPA PROGRESS BAR DI SETIAP SUBBAB) */}
                        <div className="space-y-2.5">
                          {(chapter.filteredSubbab || chapter.filteredSubtopics || []).length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                              Tidak ada subbab di BAB ini untuk {selectedGrade}.
                            </div>
                          ) : (
                            (chapter.filteredSubbab || chapter.filteredSubtopics || []).map((subbab) => {
                              const { badge, buttonText, buttonClass } =
                                renderSubtopicStatusAndAction(subbab);

                              return (
                                <div
                                  key={subbab._id || subbab.id}
                                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-2xs"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className="text-[11px] font-bold text-slate-400">
                                        Subbab {subbab.display_order || 1}
                                      </span>
                                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                        {subbab.name}
                                      </h4>
                                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                        {subbab.classReference}
                                      </span>
                                      {badge}
                                    </div>

                                    {/* Deskripsi Subbab dari Kolom DB */}
                                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                                      {subbab.description}
                                    </p>

                                    {/* Peringatan jika perlu prasyarat */}
                                    {subbab.status === "needs_prerequisite" && (
                                      <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                        Prasyarat disarankan:{" "}
                                        <span className="font-semibold underline">
                                          {subbab.prerequisiteName}
                                        </span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Tombol Aksi Subbab */}
                                  <div className="shrink-0 flex items-center self-end sm:self-center">
                                    <button
                                      onClick={() => handleSubtopicAction(subbab, chapter)}
                                      className={`px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${buttonClass}`}
                                    >
                                      <span>{buttonText}</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: KONFIRMASI MULAI PRETEST */}
      {pretestConfirmChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setPretestConfirmChapter(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-200 flex items-center justify-center mx-auto mb-3.5">
              <FileQuestion className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Mulai Diagnostic Pretest
            </h3>
            <p className="text-xs font-semibold text-primary mb-3">
              BAB: {pretestConfirmChapter.name}
            </p>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Pretest ini digunakan untuk memetakan pemahaman awalanmu sebelum membuka materi subbab. Setelah menyelesaikan pretest, daftar subbab akan otomatis terbuka.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  const chap = pretestConfirmChapter;
                  setPretestConfirmChapter(null);
                  executeCompletePretest(chap);
                }}
                className="flex-1 py-2.5 px-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mulai Pretest Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPretestConfirmChapter(null)}
                className="py-2.5 px-4 bg-white text-slate-600 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HASIL PRETEST (REVIEW NILAI KAPAN SAJA) */}
      {activePretestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActivePretestResult(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hasil Diagnostic Pretest
                </h3>
                <p className="text-xs text-slate-500">
                  BAB: {activePretestResult.chapterName}
                </p>
              </div>
            </div>

            {/* Skor & Ringkasan */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Skor Pretest</p>
                <p className="text-xl font-extrabold text-primary mt-0.5">
                  {activePretestResult.result?.score || 85}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Benar / Salah</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  <span className="text-emerald-600">
                    {activePretestResult.result?.correctCount || 13}
                  </span>{" "}
                  /{" "}
                  <span className="text-red-500">
                    {activePretestResult.result?.wrongCount || 2}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Durasi</p>
                <p className="text-xs font-bold text-slate-800 mt-1.5">
                  {activePretestResult.result?.duration || "14 Menit"}
                </p>
              </div>
            </div>

            {/* Breakdown per Subbab */}
            {activePretestResult.result?.breakdown && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Breakdown Pemahaman per Subbab
                </h4>
                <div className="space-y-2">
                  {activePretestResult.result.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs"
                    >
                      <span className="font-semibold text-slate-700">
                        {item.subtopic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">
                          {item.score}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.status === "Kuasai"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rekomendasi */}
            {activePretestResult.result?.recommendation && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl mb-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Rekomendasi Pembelajaran
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activePretestResult.result.recommendation}
                </p>
              </div>
            )}

            <button
              onClick={() => setActivePretestResult(null)}
              className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Tutup Ringkasan
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: PERINGATAN MATERI PRASYARAT */}
      {prerequisiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setPrerequisiteModal(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Materi Prasyarat Belum Selesai
                </h3>
                <p className="text-xs text-slate-500">
                  Rekomendasi Pembelajaran Terstruktur
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl mb-4 text-xs text-slate-700 leading-relaxed">
              Kamu disarankan mempelajari materi prasyarat{" "}
              <span className="font-bold text-amber-900">
                "{prerequisiteModal.prerequisiteName}"
              </span>{" "}
              terlebih dahulu untuk mempermudah pemahaman konsep baru ini.
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  const targetName = prerequisiteModal.prerequisiteName;
                  setPrerequisiteModal(null);
                  setSearchQuery(targetName);
                }}
                className="flex-1 py-2.5 px-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Cari Prasyarat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  if (prerequisiteModal.type === "chapter") {
                    const chapKey =
                      prerequisiteModal.chapter._id || prerequisiteModal.chapter.id;
                    setBypassedChapterPrerequisites(
                      (prev) => new Set(prev).add(chapKey)
                    );
                    setExpandedChapters((prev) => new Set(prev).add(chapKey));
                  }
                  setPrerequisiteModal(null);
                }}
                className="py-2.5 px-4 bg-white text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tetap Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Topics;
