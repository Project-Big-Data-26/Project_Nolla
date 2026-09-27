import React, { useState, useMemo, useRef, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import TopHeader from "../../../components/TopHeader";
import TopicSearchBar from "../../../components/SearchBar";
import ChapterCard from "../../../components/ChapterCard";
import TopicModals from "../../../components/TopicModals";
import {
  allChapters,
  allGrades,
  chaptersByLevel,
  gradeFiltersByLevel,
  educationLevels,
} from "../../../data/topicsData";

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
  const userSettingLevel = useMemo(() => {
    const saved = localStorage.getItem("user_education_level");
    return saved && educationLevels[saved]
      ? saved
      : saved === "Semua"
        ? "Semua"
        : "SMP";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Semua Kelas");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  const activeLevelChapters = useMemo(() => {
    if (userSettingLevel === "Semua") return allChapters;
    return chaptersByLevel[userSettingLevel] || chaptersByLevel.SMP;
  }, [userSettingLevel]);

  const availableGradeFilters = useMemo(() => {
    if (userSettingLevel === "Semua") return allGrades;
    return gradeFiltersByLevel[userSettingLevel] || gradeFiltersByLevel.SMP;
  }, [userSettingLevel]);

  const [chaptersData, setChaptersData] = useState(() => activeLevelChapters);

  useEffect(() => {
    setChaptersData(activeLevelChapters);
  }, [activeLevelChapters]);

  const [expandedChapters, setExpandedChapters] = useState(() => {
    const firstChapter = activeLevelChapters[0];
    return new Set([firstChapter?._id || firstChapter?.id || ""]);
  });

  const [activePretestResult, setActivePretestResult] = useState(null);
  const [pretestConfirmChapter, setPretestConfirmChapter] = useState(null);
  const [prerequisiteModal, setPrerequisiteModal] = useState(null);
  const [bypassedChapterPrerequisites, setBypassedChapterPrerequisites] =
    useState(new Set());

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

  const toggleChapter = (chapter) => {
    const chapterKey = chapter._id || chapter.id;
    const isCurrentlyExpanded = expandedChapters.has(chapterKey);

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
        const cardElement = document.getElementById(
          `chapter-card-${chapterKey}`,
        );
        if (cardElement) {
          smoothScrollToElement(cardElement, 16, 750);
        }
      }, 50);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

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

    setChaptersData((prev) =>
      prev.map((c) =>
        (c._id || c.id) === chapterKey
          ? { ...c, diagnosticStatus: "completed", pretestResult: newResult }
          : c,
      ),
    );

    chapter.diagnosticStatus = "completed";
    chapter.pretestResult = newResult;

    setExpandedChapters((prev) => new Set(prev).add(chapterKey));

    setActivePretestResult({
      chapterName: chapter.name,
      result: newResult,
    });
  };

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

    console.log(
      `Memulai pembelajaran subbab: ${subtopic.name} (${
        subtopic._id || subtopic.id
      })`,
    );
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      <Navbar activePage="Topik" />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
          <TopHeader />

          {/* Component 1: Search Bar & Filter */}
          <TopicSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            filterDropdownRef={filterDropdownRef}
            availableGradeFilters={availableGradeFilters}
          />

          {/* Chapters List */}
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Tidak ada BAB yang cocok
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Coba sesuaikan kata kunci pencarian atau ganti filter kelas
                untuk menemukan materi pelajaran.
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
              {filteredChapters.map((chapter) => (
                <ChapterCard
                  key={chapter._id || chapter.id}
                  chapter={chapter}
                  isSearching={isSearching}
                  expandedChapters={expandedChapters}
                  toggleChapter={toggleChapter}
                  setPretestConfirmChapter={setPretestConfirmChapter}
                  setActivePretestResult={setActivePretestResult}
                  selectedGrade={selectedGrade}
                  handleSubtopicAction={handleSubtopicAction}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Component 2: Modals */}
      <TopicModals
        pretestConfirmChapter={pretestConfirmChapter}
        setPretestConfirmChapter={setPretestConfirmChapter}
        executeCompletePretest={executeCompletePretest}
        activePretestResult={activePretestResult}
        setActivePretestResult={setActivePretestResult}
        prerequisiteModal={prerequisiteModal}
        setPrerequisiteModal={setPrerequisiteModal}
        setSearchQuery={setSearchQuery}
        setBypassedChapterPrerequisites={setBypassedChapterPrerequisites}
        setExpandedChapters={setExpandedChapters}
      />
    </div>
  );
};

export default Topics;
