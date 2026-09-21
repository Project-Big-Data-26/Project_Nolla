import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Award,
  Trophy,
  X,
  ArrowRight,
  Layers,
  Info,
  GraduationCap,
  Lock,
  Check,
} from "lucide-react";
import Navbar from "../components/Navbar";
import TopHeader from "../components/TopHeader";
import Modal from "../components/Modal";
import TestResultModal from "../components/TestResultModal";
import {
  educationLevels,
  chaptersByLevel,
  gradeFiltersByLevel,
} from "../data/topicsData";

// Fungsi Custom Smooth Scroll yang tenang dan teratur (duration ~900ms easeInOutCubic)
const smoothScrollToElement = (element, offsetMargin = 12, duration = 900) => {
  if (!element) return;
  const topHeaderEl = document.getElementById("top-header-section");
  const headerHeight = topHeaderEl ? topHeaderEl.offsetHeight : 70;

  const rect = element.getBoundingClientRect();
  const elementTop = rect.top + window.pageYOffset;
  const targetY = elementTop - headerHeight - offsetMargin;

  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const difference = targetY - startY;

  // Jika jarak sangat kecil (< 5px), tidak perlu scroll
  if (Math.abs(difference) < 5) return;

  const startTime = performance.now();

  // Easing curve easeInOutCubic: mulai lambat, bergerak tenang, dan berhenti secara halus
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

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
  // Jenjang pendidikan aktif: membaca dari localStorage atau default ke "SMP"
  const [currentLevel, setCurrentLevel] = useState(() => {
    const saved = localStorage.getItem("user_education_level");
    return saved && educationLevels[saved] ? saved : "SMP";
  });

  // Modal Switcher Jenjang (SD, SMP, SMA)
  const [showLevelModal, setShowLevelModal] = useState(false);

  // State data bab & subbab sesuai jenjang aktif
  const [chaptersData, setChaptersData] = useState(
    () => chaptersByLevel[currentLevel] || chaptersByLevel.SMP,
  );

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Semua Kelas");

  // State accordion: Set of chapter IDs yang sedang expanded
  const [expandedChapters, setExpandedChapters] = useState(() => {
    const firstChapter = (chaptersByLevel[currentLevel] ||
      chaptersByLevel.SMP)[0];
    return new Set([firstChapter?.id || ""]);
  });

  // State Modal Hasil Pretest
  const [activePretestResult, setActivePretestResult] = useState(null);

  // State Modal Hasil Post Test
  const [activePostTestResult, setActivePostTestResult] = useState(null);

  // State Modal Konfirmasi / Mulai Pretest
  const [pretestConfirmChapter, setPretestConfirmChapter] = useState(null);

  // State Modal Konfirmasi / Mulai Post Test
  const [postTestConfirmChapter, setPostTestConfirmChapter] = useState(null);

  // State Modal Post Test Terkunci (jika subbab belum selesai)
  const [postTestLockedModal, setPostTestLockedModal] = useState(null);

  // State Modal Pretest Wajib
  // (ketika user klik subbab pada bab yang belum selesai pretest)
  const [mandatoryPretestModal, setMandatoryPretestModal] = useState(null);

  // State Modal Peringatan Prasyarat (Pop up di tengah untuk Bab atau Subbab)
  const [prerequisiteModal, setPrerequisiteModal] = useState(null);

  // Chapters yang telah diizinkan user untuk dibuka meski belum selesai prasyarat
  const [bypassedChapterPrerequisites, setBypassedChapterPrerequisites] =
    useState(new Set());

  // Daftar opsi filter kelas untuk jenjang aktif (SD: Kelas 1-6, SMP: 7-9, SMA: 10-12)
  const availableGradeFilters =
    gradeFiltersByLevel[currentLevel] || gradeFiltersByLevel.SMP;

  // Mengubah Jenjang Pendidikan (SD / SMP / SMA)
  const handleSelectLevel = (levelKey) => {
    setCurrentLevel(levelKey);
    localStorage.setItem("user_education_level", levelKey);
    const newChapters = chaptersByLevel[levelKey] || chaptersByLevel.SMP;
    setChaptersData(newChapters);
    setSelectedGrade("Semua Kelas");
    setSearchQuery("");
    setShowLevelModal(false);
    // Buka bab pertama dari jenjang yang baru dipilih
    setExpandedChapters(new Set([newChapters[0]?.id || ""]));
  };

  // Toggle buka/tutup accordion BAB dengan efek auto-scroll tenang dan halus ke batas bawah top header
  const toggleChapter = (chapter) => {
    const isCurrentlyExpanded = expandedChapters.has(chapter.id);

    // Jika ingin membuka dan BAB memiliki prasyarat yang belum selesai dan belum di-bypass
    if (
      !isCurrentlyExpanded &&
      chapter.hasPrerequisite &&
      !chapter.prerequisiteCompleted &&
      !bypassedChapterPrerequisites.has(chapter.id)
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
      if (next.has(chapter.id)) {
        next.delete(chapter.id);
      } else {
        next.add(chapter.id);
      }
      return next;
    });

    // Jika card dibuka, gulirkan batas atas card hingga pas di batas bawah top header secara perlahan & tenang
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        const cardElement = document.getElementById(
          `chapter-card-${chapter.id}`,
        );
        if (cardElement) {
          smoothScrollToElement(cardElement, 14, 850);
        }
      }, 50);
    }
  };

  // Expand semua bab jika user sedang mencari kata kunci
  const isSearching = searchQuery.trim().length > 0;

  // Filtering Chapters & Subtopics berdasarkan Search dan Filter Kelas
  const filteredChapters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return chaptersData
      .map((chapter) => {
        const chapterNameMatches =
          chapter.name.toLowerCase().includes(query) ||
          chapter.description.toLowerCase().includes(query);

        const matchingSubtopics = chapter.subtopics.filter((sub) => {
          const matchesGrade =
            selectedGrade === "Semua Kelas" ||
            sub.classReference.toLowerCase() === selectedGrade.toLowerCase();

          if (!matchesGrade) return false;

          if (!query) return true;

          const subNameMatches = sub.name.toLowerCase().includes(query);
          return subNameMatches || chapterNameMatches;
        });

        const hasMatchingSubtopics = matchingSubtopics.length > 0;

        return {
          ...chapter,
          filteredSubtopics: matchingSubtopics,
          isMatch: hasMatchingSubtopics,
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
      breakdown: chapter.subtopics.map((s, idx) => ({
        subtopic: s.name,
        status: idx % 2 === 0 ? "Kuasai" : "Perlu Latihan",
        score: idx % 2 === 0 ? "90%" : "65%",
      })),
      recommendation: `Berdasarkan hasil pretest diagnostik, kamu siap mempelajari materi bab ${chapter.name}. Direkomendasikan memulai dari subbab pertama untuk memperkuat dasar konsep.`,
    };

    setChaptersData((prev) =>
      prev.map((c) =>
        c.id === chapter.id
          ? { ...c, diagnosticStatus: "completed", pretestResult: newResult }
          : c,
      ),
    );

    // Buka accordion BAB jika belum terbuka
    setExpandedChapters((prev) => new Set(prev).add(chapter.id));

    // Buka dialog ringkasan hasil
    setActivePretestResult({
      chapterName: chapter.name,
      result: newResult,
    });
  };

  // Eksekusi penyelesaian Post Test
  const executeCompletePostTest = (chapter) => {
    const simulatedScore = 92;
    const correct = Math.round((simulatedScore / 100) * 20);
    const wrong = 20 - correct;
    const newResult = {
      score: simulatedScore,
      correctCount: correct,
      wrongCount: wrong,
      duration: "19 Menit 45 Detik",
      breakdown: chapter.subtopics.map((s) => ({
        subtopic: s.name,
        status: "Sangat Menguasai",
        score: "95%",
      })),
      recommendation: `Luar biasa! Kamu telah berhasil menuntaskan seluruh materi pada bab ${chapter.name} dengan penguasaan konsep yang sangat matang. Kamu siap melanjutkan ke bab berikutnya!`,
    };

    setChaptersData((prev) =>
      prev.map((c) =>
        c.id === chapter.id
          ? { ...c, postTestStatus: "completed", postTestResult: newResult }
          : c,
      ),
    );

    setActivePostTestResult({
      chapterName: chapter.name,
      result: newResult,
    });
  };

  // Handler klik aksi subbab
  const handleSubtopicAction = (subtopic, chapter) => {
    // 1. Pretest WAJIB: Jika bab belum menyelesaikan pretest, wajibkan pretest dulu!
    if (chapter.diagnosticStatus !== "completed") {
      setMandatoryPretestModal({
        chapter,
        subtopic,
      });
      return;
    }

    // 2. Prasyarat: Jika subbab memiliki prasyarat yang belum dikuasai
    if (subtopic.status === "needs_prerequisite") {
      setPrerequisiteModal({
        type: "subtopic",
        subtopic,
        chapter,
        prerequisiteName: subtopic.prerequisiteName,
      });
      return;
    }

    // 3. Subbab normal: Langsung lanjutkan belajar tanpa pop up / window.alert yang mengganggu
    console.log(
      `Memulai pembelajaran subbab: ${subtopic.name} (${subtopic.id})`,
    );
  };

  // Handler tombol Post Test di dalam dropdown
  const handlePostTestAction = (chapter) => {
    if (chapter.postTestStatus === "completed" && chapter.postTestResult) {
      setActivePostTestResult({
        chapterName: chapter.name,
        result: chapter.postTestResult,
      });
    } else if (chapter.postTestStatus === "available") {
      setPostTestConfirmChapter(chapter);
    } else {
      // Post test locked: munculkan modal di tengah
      setPostTestLockedModal(chapter);
    }
  };

  // Menentukan badge & tombol aksi subbab berdasarkan statusnya
  const renderSubtopicStatusAndAction = (subtopic, chapter) => {
    const isPretestPending = chapter.diagnosticStatus !== "completed";

    // Jika pretest BAB belum selesai, tampilkan indikasi bahwa pretest diperlukan
    if (isPretestPending) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Lock className="w-3 h-3 text-amber-600" />
            Pretest Wajib
          </span>
        ),
        buttonText: "Ambil Pretest",
        buttonClass:
          "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100",
      };
    }

    switch (subtopic.status) {
      case "completed":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Selesai
            </span>
          ),
          buttonText: "Lihat Hasil",
          buttonClass:
            "bg-neutral-card hover:bg-neutral-50 text-neutral-text border border-neutral-border",
        };
      case "in_progress":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-primary border border-blue-100">
              Sedang Dipelajari
            </span>
          ),
          buttonText: "Lanjutkan",
          buttonClass: "bg-primary hover:bg-primary-hover text-white shadow-xs",
        };
      case "needs_prerequisite":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Prasyarat Disarankan
            </span>
          ),
          buttonText: "Mulai",
          buttonClass: "bg-amber-500 hover:bg-amber-600 text-white shadow-xs",
        };
      case "diagnostic_available":
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
              Pretest Siap
            </span>
          ),
          buttonText: "Ambil Pretest",
          buttonClass: "bg-purple-600 hover:bg-purple-700 text-white shadow-xs",
        };
      case "not_started":
      default:
        return {
          badge: (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
              Belum Dimulai
            </span>
          ),
          buttonText: "Mulai",
          buttonClass:
            "bg-neutral-card hover:bg-neutral-50 text-primary border border-primary/30 hover:border-primary",
        };
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Sidebar Navigation */}
      <Navbar activePage="Topik" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-7 max-w-6xl mx-auto w-full pb-24 md:pb-8">
        {/* Top Header Sticky with ID for smooth scrolling anchor */}
        <TopHeader />

        {/* 1. HEADER SECTION */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {/* Active Level Selector Badge (Bisa diklik untuk beralih antara SD, SMP, SMA) */}
                <button
                  onClick={() => setShowLevelModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs border border-primary/25 transition-all cursor-pointer shadow-2xs group"
                  title="Klik untuk memilih jenjang SD, SMP, atau SMA"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    {educationLevels[currentLevel]?.label ||
                      `Matematika • ${currentLevel}`}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-70 group-hover:translate-y-0.5 transition-transform" />
                </button>
                <span className="text-xs text-neutral-muted">
                  Kurikulum Nasional
                </span>
                <span className="text-[11px] text-primary/80 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-medium">
                  Klik badge jenjang untuk beralih SD / SMP / SMA
                </span>
              </div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-neutral-text">
                Topic Library
              </h1>
              <p className="text-xs md:text-sm text-neutral-muted mt-1 max-w-2xl">
                Peta struktur pembelajaran Matematika. Jelajahi BAB dan SUBBAB
                secara terstruktur untuk mengoptimalkan pemahaman konsepmu.
              </p>
            </div>
          </div>
        </header>

        {/* 2. SEARCH BAR */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama BAB atau SUBBAB (contoh: Persamaan, Pecahan, Geometri)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-neutral-card border border-neutral-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-neutral-muted/70 text-neutral-text shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-muted hover:text-neutral-text rounded-md cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 3. FILTER KELAS (Content metadata filter dinamis berdasarkan jenjang aktif) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            <span className="text-xs font-semibold text-neutral-muted mr-1 shrink-0">
              Filter Kelas ({currentLevel}):
            </span>
            {availableGradeFilters.map((grade) => {
              const isActive = selectedGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-white border border-primary shadow-xs"
                      : "bg-neutral-card text-neutral-muted border border-neutral-border hover:bg-neutral-50 hover:text-neutral-text"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </div>
          {selectedGrade !== "Semua Kelas" && (
            <p className="text-[11px] text-neutral-muted mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-primary" />
              Menyaring subbab berdasarkan referensi kurikulum {selectedGrade}.
              Kelas bukan penentu batas kemampuan atau difficulty.
            </p>
          )}
        </div>

        {/* 4. CHAPTER CARDS ACCORDION LIST */}
        {filteredChapters.length === 0 ? (
          <div className="text-center py-12 px-4 bg-neutral-card rounded-2xl border border-neutral-border">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-text mb-1">
              Tidak ada BAB atau Subbab yang cocok
            </h3>
            <p className="text-xs text-neutral-muted max-w-sm mx-auto mb-4">
              Coba sesuaikan kata kunci pencarian atau ganti filter kelas untuk
              menemukan materi yang dicari.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGrade("Semua Kelas");
              }}
              className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Reset Filter & Pencarian
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChapters.map((chapter) => {
              const isExpanded =
                isSearching || expandedChapters.has(chapter.id);
              const isPretestPending = chapter.diagnosticStatus !== "completed";

              // Perhitungan progress BAB: persentase rata-rata penyelesaian subbab
              const totalSubtopics = chapter.subtopics.length;
              const completedSubtopics = chapter.subtopics.filter(
                (s) => s.status === "completed",
              ).length;

              const chapterProgressPercent =
                totalSubtopics > 0
                  ? Math.round(
                      chapter.subtopics.reduce(
                        (sum, s) => sum + s.progress,
                        0,
                      ) / totalSubtopics,
                    )
                  : 0;

              return (
                <article
                  id={`chapter-card-${chapter.id}`}
                  key={chapter.id}
                  className={`bg-neutral-card border rounded-2xl overflow-hidden transition-all duration-300 shadow-xs scroll-mt-24 ${
                    isExpanded
                      ? "border-primary/40 ring-1 ring-primary/15 shadow-sm"
                      : "border-neutral-border hover:border-primary/30"
                  }`}
                >
                  {/* CARD HEADER (BAB SUMMARY) */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Icon, Title, Description, Badges */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Layers className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="font-heading text-base sm:text-lg font-bold text-neutral-text leading-tight">
                              {chapter.name}
                            </h2>

                            {/* Metadata Badges */}
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                              {chapter.classRange}
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-primary border border-blue-100">
                              {chapter.filteredSubtopics.length} Subbab
                              {selectedGrade !== "Semua Kelas" &&
                                ` (${selectedGrade})`}
                            </span>

                            {/* Status Pretest Wajib Badge */}
                            {isPretestPending && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Pretest Belum Diambil
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-muted leading-relaxed line-clamp-2">
                            {chapter.description}
                          </p>

                          {/* Progress Indicator */}
                          {/* <div className="mt-3 flex items-center gap-3 max-w-md">
                            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${chapterProgressPercent}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-neutral-muted font-medium whitespace-nowrap">
                              Progress{" "}
                              <span className="font-semibold text-neutral-text">
                                {chapterProgressPercent}%
                              </span>
                              <span className="hidden sm:inline text-neutral-muted/70 ml-1.5">
                                ({completedSubtopics}/{totalSubtopics} selesai)
                              </span>
                            </div>
                          </div> */}
                        </div>
                      </div>

                      {/* Right: Accordion Toggle Button (Memicu Smooth Scroll) */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-neutral-border/60 w-full md:w-auto justify-end">
                        <button
                          onClick={() => toggleChapter(chapter)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            isExpanded
                              ? "bg-primary/10 text-primary border border-primary/25 hover:bg-primary/15"
                              : "bg-neutral-card text-neutral-text hover:bg-neutral-100 border border-neutral-border"
                          }`}
                          aria-expanded={isExpanded}
                        >
                          <span>
                            {isExpanded ? "Tutup Subbab" : "Lihat Subbab"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-muted" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED SECTION (DROPDOWN LIST):
                      1. PRETEST (Paling Atas)
                      2. DAFTAR SUBBAB (Di Tengah)
                      3. POST TEST (Paling Bawah)
                  */}
                  {isExpanded && (
                    <div className="border-t border-neutral-border bg-neutral-bg/40 p-4 sm:p-5 space-y-4 animate-in fade-in duration-300">
                      {/* === 1. PRETEST ITEM (PALING ATAS) === */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-muted">
                            Langkah 1: Tes Awal (Diagnostic)
                          </span>
                        </div>
                        <div
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            chapter.diagnosticStatus === "completed"
                              ? "bg-emerald-50/40 border-emerald-200"
                              : "bg-amber-50/40 border-amber-200/90 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                chapter.diagnosticStatus === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              <FileQuestion className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h4 className="text-sm font-bold text-neutral-text">
                                  Diagnostic Pretest: {chapter.name}
                                </h4>
                                {chapter.diagnosticStatus === "completed" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Selesai (Skor:{" "}
                                    {chapter.pretestResult?.score || 85})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Lock className="w-3 h-3 text-amber-700" />
                                    Wajib Dikerjakan Dahulu
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-muted leading-relaxed">
                                {chapter.diagnosticStatus === "completed"
                                  ? "Kamu sudah menyelesaikan pretest diagnostik untuk memetakan pemahaman awalan materi bab ini."
                                  : "Uji diagnostik adaptif untuk memetakan kemampuan awal sebelum membuka seluruh latihan subbab."}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 self-end sm:self-center">
                            {chapter.diagnosticStatus === "completed" ? (
                              <button
                                onClick={() =>
                                  setActivePretestResult({
                                    chapterName: chapter.name,
                                    result: chapter.pretestResult,
                                  })
                                }
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-card hover:bg-neutral-50 text-emerald-700 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Lihat Hasil</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setPretestConfirmChapter(chapter)
                                }
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <FileQuestion className="w-3.5 h-3.5" />
                                <span>Ambil Pretest</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* === 2. DAFTAR SUBBAB (DI TENGAH) === */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-muted">
                            Langkah 2: Materi & Latihan Subbab (
                            {chapter.filteredSubtopics.length})
                          </span>
                          {isPretestPending && (
                            <span className="text-[11px] text-amber-700 font-medium bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
                              Selesaikan pretest untuk membuka subbab
                            </span>
                          )}
                        </div>

                        {chapter.filteredSubtopics.length === 0 ? (
                          <div className="py-6 text-center text-xs text-neutral-muted bg-neutral-card rounded-xl border border-neutral-border">
                            Tidak ada subbab di BAB ini untuk {selectedGrade}.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2.5">
                            {chapter.filteredSubtopics.map((subtopic) => {
                              const { badge, buttonText, buttonClass } =
                                renderSubtopicStatusAndAction(
                                  subtopic,
                                  chapter,
                                );

                              return (
                                <div
                                  key={subtopic.id}
                                  className="bg-neutral-card border border-neutral-border rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all shadow-2xs"
                                >
                                  {/* Left Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <h4 className="text-sm font-bold text-neutral-text leading-tight">
                                        {subtopic.name}
                                      </h4>
                                      <span className="text-[11px] font-medium px-2 py-0.2 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                                        {subtopic.classReference}
                                      </span>
                                      {badge}
                                    </div>

                                    {/* Prerequisite hint if needs_prerequisite */}
                                    {subtopic.status === "needs_prerequisite" &&
                                      !isPretestPending && (
                                        <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1.5 font-medium">
                                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                          Prasyarat disarankan:{" "}
                                          <span className="underline font-semibold">
                                            {subtopic.prerequisiteName}
                                          </span>
                                        </p>
                                      )}

                                    {/* Progress bar per subtopic */}
                                    {/* <div className="mt-2 flex items-center gap-3 max-w-xs">
                                      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${subtopic.status === "completed"
                                              ? "bg-emerald-500"
                                              : "bg-primary"
                                            }`}
                                          style={{ width: `${subtopic.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[11px] text-neutral-muted font-medium">
                                        {subtopic.progress}%
                                      </span>
                                    </div> */}
                                  </div>

                                  {/* Right Action Button */}
                                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                                    <button
                                      onClick={() =>
                                        handleSubtopicAction(subtopic, chapter)
                                      }
                                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${buttonClass}`}
                                    >
                                      <span>{buttonText}</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* === 3. POST TEST ITEM (PALING BAWAH) === */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-muted">
                            Langkah 3: Evaluasi Akhir (Post Test)
                          </span>
                        </div>
                        <div
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            chapter.postTestStatus === "completed"
                              ? "bg-purple-50/40 border-purple-200"
                              : chapter.postTestStatus === "available"
                                ? "bg-blue-50/40 border-blue-200 shadow-2xs"
                                : "bg-neutral-100/50 border-neutral-200"
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                chapter.postTestStatus === "completed"
                                  ? "bg-purple-100 text-purple-700"
                                  : chapter.postTestStatus === "available"
                                    ? "bg-blue-100 text-primary"
                                    : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              <Trophy className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h4 className="text-sm font-bold text-neutral-text">
                                  Post Test: {chapter.name}
                                </h4>
                                {chapter.postTestStatus === "completed" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Selesai (Skor:{" "}
                                    {chapter.postTestResult?.score || 90})
                                  </span>
                                ) : chapter.postTestStatus === "available" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-primary border border-blue-200">
                                    Siap Dikerjakan
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-200 text-neutral-600 border border-neutral-300">
                                    <Lock className="w-3 h-3 text-neutral-500" />
                                    Selesaikan Subbab Dahulu
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-muted leading-relaxed">
                                {chapter.postTestStatus === "completed"
                                  ? "Selamat! Kamu telah menyelesaikan post test untuk memvalidasi ketuntasan belajar bab ini."
                                  : chapter.postTestStatus === "available"
                                    ? "Seluruh materi telah dipelajari. Ambil post test untuk menguji ketuntasan dan mengukur pemahaman akhirmu."
                                    : "Evaluasi akhir akan terbuka setelah kamu mempelajari materi pada subbab di atas."}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 self-end sm:self-center">
                            {chapter.postTestStatus === "completed" ? (
                              <button
                                onClick={() =>
                                  setActivePostTestResult({
                                    chapterName: chapter.name,
                                    result: chapter.postTestResult,
                                  })
                                }
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-card hover:bg-neutral-50 text-purple-700 border border-purple-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Lihat Hasil</span>
                              </button>
                            ) : chapter.postTestStatus === "available" ? (
                              <button
                                onClick={() => handlePostTestAction(chapter)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Mulai Post Test</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePostTestAction(chapter)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-card hover:bg-neutral-50 text-neutral-600 border border-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Info Post Test</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* MODAL 0: PILIH TINGKATAN JENJANG BELAJAR (SD / SMP / SMA) - POP UP DI TENGAH */}
        {showLevelModal && (
          <Modal onClose={() => setShowLevelModal(false)}>
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary border border-blue-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-text leading-tight">
                  Pilih Jenjang Pembelajaran
                </h3>
                <p className="text-xs text-neutral-muted">
                  Sesuaikan kurikulum dengan jenjang sekolahmu
                </p>
              </div>
            </div>

            <div className="space-y-2.5 my-4">
              {Object.entries(educationLevels).map(([key, info]) => {
                const isSelected = currentLevel === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectLevel(key)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-primary text-primary ring-1 ring-primary/20 shadow-2xs"
                        : "bg-neutral-card border-neutral-border hover:border-primary/40 text-neutral-text"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-text">
                          {info.name}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.2 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {info.grades.filter((g) => g !== "Semua Kelas")[0]}–
                          {info.grades[info.grades.length - 1]}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-muted mt-1">
                        {key === "SD" &&
                          "Operasi Bilangan Cacah, Pecahan, Geometri Dasar, Pengolahan Data"}
                        {key === "SMP" &&
                          "Bilangan Bulat & Akar, Aljabar, Teorema Pythagoras, Peluang"}
                        {key === "SMA" &&
                          "Nilai Mutlak & SPLTV, Trigonometri, Kalkulus, Dimensi Tiga"}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-neutral-muted text-center">
              Filter kelas dan daftar BAB akan otomatis disesuaikan dengan
              jenjang terpilih.
            </p>
          </Modal>
        )}

        {/* MODAL 1: PRETEST WAJIB SEBELUM MENGERJAKAN SUBBAB (POP UP DI TENGAH) */}
        {mandatoryPretestModal && (
          <Modal onClose={() => setMandatoryPretestModal(null)}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3.5">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-neutral-text mb-1.5">
                Pretest Wajib Diselesaikan
              </h3>
              <p className="text-xs font-semibold text-primary mb-3">
                BAB: {mandatoryPretestModal.chapter.name}
              </p>

              <p className="text-xs text-neutral-muted leading-relaxed mb-6">
                Karena kamu baru mulai mempelajari bab ini, kamu wajib
                menyelesaikan{" "}
                <span className="font-semibold text-neutral-text">
                  Diagnostic Pretest
                </span>{" "}
                terlebih dahulu sebelum dapat membuka dan mengerjakan latihan
                pada subbab{" "}
                <span className="font-semibold text-neutral-text">
                  "{mandatoryPretestModal.subtopic.name}"
                </span>
                . Hal ini diperlukan agar sistem dapat memetakan materi awal
                yang paling tepat untukmu.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    const chapter = mandatoryPretestModal.chapter;
                    setMandatoryPretestModal(null);
                    executeCompletePretest(chapter);
                  }}
                  className="flex-1 py-2.5 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileQuestion className="w-4 h-4" />
                  <span>Ambil Pretest Sekarang</span>
                </button>
                <button
                  onClick={() => setMandatoryPretestModal(null)}
                  className="py-2.5 px-4 bg-neutral-card text-neutral-muted border border-neutral-border text-xs font-medium rounded-xl hover:bg-neutral-50 hover:text-neutral-text transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 2: KONFIRMASI MULAI PRETEST (POP UP DI TENGAH) */}
        {pretestConfirmChapter && (
          <Modal onClose={() => setPretestConfirmChapter(null)}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary border border-blue-200 flex items-center justify-center mx-auto mb-3.5">
                <FileQuestion className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-neutral-text mb-1.5">
                Mulai Diagnostic Pretest
              </h3>
              <p className="text-xs font-semibold text-primary mb-3">
                BAB: {pretestConfirmChapter.name}
              </p>

              <p className="text-xs text-neutral-muted leading-relaxed mb-6">
                Pretest ini hanya dapat diambil{" "}
                <span className="font-semibold text-neutral-text">1 kali</span>{" "}
                untuk mendeteksi penguasaan materi awalmu. Setelah selesai,
                seluruh subbab pada bab ini akan terbuka dan kamu dapat langsung
                mulai berlatih secara terarah.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    const chapter = pretestConfirmChapter;
                    setPretestConfirmChapter(null);
                    executeCompletePretest(chapter);
                  }}
                  className="flex-1 py-2.5 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Mulai Pretest Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPretestConfirmChapter(null)}
                  className="py-2.5 px-4 bg-neutral-card text-neutral-muted border border-neutral-border text-xs font-medium rounded-xl hover:bg-neutral-50 hover:text-neutral-text transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 3: KONFIRMASI MULAI POST TEST (POP UP DI TENGAH) */}
        {postTestConfirmChapter && (
          <Modal onClose={() => setPostTestConfirmChapter(null)}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto mb-3.5">
                <Trophy className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-neutral-text mb-1.5">
                Mulai Evaluasi Post Test
              </h3>
              <p className="text-xs font-semibold text-primary mb-3">
                BAB: {postTestConfirmChapter.name}
              </p>

              <p className="text-xs text-neutral-muted leading-relaxed mb-6">
                Post test ini digunakan untuk mengukur dan memvalidasi
                ketuntasan pemahamanmu setelah mempelajari materi subbab pada
                bab ini.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    const chapter = postTestConfirmChapter;
                    setPostTestConfirmChapter(null);
                    executeCompletePostTest(chapter);
                  }}
                  className="flex-1 py-2.5 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Mulai Post Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPostTestConfirmChapter(null)}
                  className="py-2.5 px-4 bg-neutral-card text-neutral-muted border border-neutral-border text-xs font-medium rounded-xl hover:bg-neutral-50 hover:text-neutral-text transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 4: POST TEST TERKUNCI (POP UP DI TENGAH) */}
        {postTestLockedModal && (
          <Modal onClose={() => setPostTestLockedModal(null)}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 border border-neutral-200 flex items-center justify-center mx-auto mb-3.5">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-neutral-text mb-1.5">
                Post Test Belum Terbuka
              </h3>
              <p className="text-xs font-semibold text-primary mb-3">
                BAB: {postTestLockedModal.name}
              </p>

              <p className="text-xs text-neutral-muted leading-relaxed mb-6">
                Post test berfungsi sebagai evaluasi akhir ketuntasan bab. Kami
                menyarankan untuk mempelajari dan menyelesaikan materi subbab di
                atas terlebih dahulu agar hasil evaluasimu maksimal.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    const chapter = postTestLockedModal;
                    setPostTestLockedModal(null);
                    executeCompletePostTest(chapter);
                  }}
                  className="flex-1 py-2.5 px-4 bg-neutral-card text-neutral-text border border-neutral-border text-xs font-semibold rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Tetap Coba Evaluasi Akhir
                </button>
                <button
                  onClick={() => setPostTestLockedModal(null)}
                  className="py-2.5 px-4 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Pelajari Subbab Dahulu
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 5: PERINGATAN MATERI PRASYARAT (POP UP DI TENGAH) */}
        {prerequisiteModal && (
          <Modal onClose={() => setPrerequisiteModal(null)}>
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-text leading-tight">
                  Materi Prasyarat Belum Dikuasai
                </h3>
                <p className="text-xs text-neutral-muted">
                  Rekomendasi Pembelajaran Adaptif
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl mb-4 text-xs text-neutral-text leading-relaxed">
              Kamu belum mempelajari atau menyelesaikan materi prasyarat{" "}
              <span className="font-bold text-amber-900">
                "{prerequisiteModal.prerequisiteName}"
              </span>
              . Kami sangat menyarankan mempelajari materi prasyarat terlebih
              dahulu agar kamu tidak kesulitan memahami konsep baru pada materi
              ini.
            </div>

            <p className="text-xs text-neutral-muted leading-relaxed mb-6">
              Namun, kamu tetap memiliki kebebasan untuk melanjutkan belajar{" "}
              <span className="font-semibold text-neutral-text">
                "
                {prerequisiteModal.type === "chapter"
                  ? prerequisiteModal.chapter.name
                  : prerequisiteModal.subtopic.name}
                "
              </span>{" "}
              sekarang jika kamu merasa sudah cukup siap.
            </p>

            {/* Action Buttons: Pelajari Prasyarat vs Tetap Lanjutkan Belajar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  const targetName = prerequisiteModal.prerequisiteName;
                  setPrerequisiteModal(null);
                  setSearchQuery(targetName);
                }}
                className="flex-1 py-2.5 px-3 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Pelajari Prasyarat Dahulu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  if (prerequisiteModal.type === "chapter") {
                    const chapId = prerequisiteModal.chapter.id;
                    setBypassedChapterPrerequisites((prev) =>
                      new Set(prev).add(chapId),
                    );
                    setExpandedChapters((prev) => new Set(prev).add(chapId));
                  } else {
                    console.log(
                      `User memilih tetap belajar subbab: ${prerequisiteModal.subtopic.name}`,
                    );
                  }
                  setPrerequisiteModal(null);
                }}
                className="py-2.5 px-4 bg-neutral-card text-neutral-text border border-neutral-border text-xs font-semibold rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Tetap Lanjutkan Belajar
              </button>
            </div>
          </Modal>
        )}

        {/* MODAL 6: HASIL PRETEST (POP UP DI TENGAH) */}
        {activePretestResult && (
          <TestResultModal
            variant="pretest"
            chapterName={activePretestResult.chapterName}
            result={activePretestResult.result}
            onClose={() => setActivePretestResult(null)}
          />
        )}

        {/* MODAL 7: HASIL POST TEST (POP UP DI TENGAH) */}
        {activePostTestResult && (
          <TestResultModal
            variant="posttest"
            chapterName={activePostTestResult.chapterName}
            result={activePostTestResult.result}
            onClose={() => setActivePostTestResult(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Topics;
