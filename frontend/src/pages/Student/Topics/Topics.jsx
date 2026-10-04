import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import TopHeader from "../../../components/TopHeader";
import TopicSearchBar from "../../../components/SearchBar";
import ChapterCard from "../../../components/ChapterCard";
import TopicModals from "../../../components/TopicModals";
import API from "../../../api/axios";

const ALL_GRADES = "Semua Kelas";
const TOPIC_RETURN_STATE_KEY = "topics:return-state";

const readTopicReturnState = () => {
  try {
    const stored = sessionStorage.getItem(TOPIC_RETURN_STATE_KEY);
    sessionStorage.removeItem(TOPIC_RETURN_STATE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem("accessToken") || localStorage.getItem("token") || ""
    }`,
  },
});

const normalizeBab = (bab, classInfo) => ({
  ...bab,
  _id: bab.id,
  diagnosticStatus: bab.has_pretest ? "completed" : "not_completed",
  classRange: classInfo?.name || "Kurikulum Nasional",
  subbab: (bab.subbab || []).map((subbab) => ({
    ...subbab,
    _id: subbab.id,
    classReference: classInfo?.name || "",
    hasLearningActivity: Boolean(subbab.started || subbab.completed),
    status: subbab.completed
      ? "completed"
      : subbab.started
        ? "in_progress"
        : "not_started",
  })),
});

const fetchBabList = async (classes, selectedGrade) => {
  const targetClasses =
    selectedGrade === ALL_GRADES
      ? classes
      : classes.filter((item) => item.name === selectedGrade);

  if (!targetClasses.length) {
    const response = await API.get("/dashboard/bab", getAuthConfig());
    return (response.data.data || []).map((bab) => normalizeBab(bab));
  }

  const responses = await Promise.all(
    targetClasses.map(async (classInfo) => {
      const response = await API.get("/dashboard/bab", {
        ...getAuthConfig(),
        params: { kelas: classInfo.nomor_kelas },
      });
      return (response.data.data || []).map((bab) =>
        normalizeBab(bab, classInfo),
      );
    }),
  );

  return responses.flat();
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "-";
  const minutes = Math.floor(seconds / 60);
  return `${minutes} Menit ${seconds % 60} Detik`;
};

const normalizePretestResult = (data) => ({
  score: data.score ?? 0,
  correctCount: data.correct_answers ?? 0,
  wrongCount: data.wrong_answers ?? 0,
  duration: formatDuration(data.duration),
  prerequisiteBreakdown: (data.prerequisite_bab_result || []).map((item) => ({
    name: item.name,
    status: item.status,
  })),
  breakdown: (data.submateri_result || []).map((item) => ({
    subtopic: item.subbab_name,
    status: item.current_cognitive_level || "Belum dinilai",
    difficulty: item.current_cognitive_level,
    score: item.current_cognitive_score ?? "-",
    elo: item.current_cognitive_score, // Membantu UI baru untuk menampilkan elo
  })),
  recommendation: data.recommendation || "",
});

const smoothScrollToElement = (element, offsetMargin = 16, duration = 800) => {
  if (!element) return;
  const header = document.getElementById("top-header-section");
  const headerHeight = header ? header.offsetHeight : 80;
  const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const difference = elementTop - headerHeight - offsetMargin - startY;
  if (Math.abs(difference) < 5) return;

  const startTime = performance.now();
  const easeInOutCubic = (value) =>
    value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    window.scrollTo(0, startY + difference * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const Topics = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnTopicState] = useState(readTopicReturnState);
  const [searchQuery, setSearchQuery] = useState(
    () => returnTopicState.searchQuery || "",
  );
  const [selectedGrade, setSelectedGrade] = useState(
    () => returnTopicState.selectedGrade || ALL_GRADES,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [availableGradeFilters, setAvailableGradeFilters] = useState([
    ALL_GRADES,
  ]);
  const [chaptersData, setChaptersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [collapsedSearchChapters, setCollapsedSearchChapters] = useState(
    new Set(),
  );
  const [priorityChapterId, setPriorityChapterId] = useState(() =>
    searchParams.get("babId"),
  );
  const [activePretestResult, setActivePretestResult] = useState(null);
  const [pretestConfirmChapter, setPretestConfirmChapter] = useState(null);
  const [pretestLoadingId, setPretestLoadingId] = useState(null);
  const [prerequisiteModal, setPrerequisiteModal] = useState(null);
  const [bypassedChapterPrerequisites, setBypassedChapterPrerequisites] =
    useState(new Set());
  const pretestResultId = searchParams.get("pretestResultId");
  const resultBabId = searchParams.get("babId");
  const resultChapterName = searchParams.get("chapterName");

  useEffect(() => {
    let isCurrent = true;

    const loadClasses = async () => {
      try {
        const response = await API.get("/dashboard/classes", getAuthConfig());
        if (!isCurrent) return;
        const classList = response.data.data.classes || [];
        setClasses(classList);
        setAvailableGradeFilters([
          ALL_GRADES,
          ...classList.map((item) => item.name),
        ]);
      } catch (error) {
        if (isCurrent) {
          setLoadError(
            error.response?.data?.message || "Daftar kelas gagal dimuat.",
          );
        }
      } finally {
        if (isCurrent) setClassesLoaded(true);
      }
    };

    loadClasses();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!classesLoaded) return undefined;
    let isCurrent = true;

    const loadBab = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const babList = await fetchBabList(classes, selectedGrade);
        if (isCurrent) setChaptersData(babList);
      } catch (error) {
        if (!isCurrent) return;
        setLoadError(
          error.response?.data?.message || "Daftar BAB gagal dimuat.",
        );
        setChaptersData([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadBab();
    return () => {
      isCurrent = false;
    };
  }, [classes, classesLoaded, selectedGrade]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!pretestResultId || isLoading) return undefined;
    let isCurrent = true;
    const chapter = chaptersData.find(
      (item) => String(item._id) === String(resultBabId),
    ) || {
      _id: resultBabId,
      name: resultChapterName || "Pretest",
    };

    showPretestResult(chapter, pretestResultId)
      .catch((error) => {
        if (isCurrent) {
          setLoadError(
            error.response?.data?.message || "Hasil pretest gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setSearchParams(
            (previous) => {
              previous.delete("pretestResultId");
              previous.delete("babId");
              previous.delete("chapterName");
              return previous;
            },
            { replace: true },
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    pretestResultId,
    resultBabId,
    resultChapterName,
    chaptersData,
    isLoading,
    setSearchParams,
  ]);

  const toggleChapter = (chapter, isCurrentlyExpanded) => {
    const chapterKey = chapter._id || chapter.id;
    const chapterIsExpanded =
      isCurrentlyExpanded ?? expandedChapters.has(chapterKey);

    if (
      !chapterIsExpanded &&
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

    if (isSearching) {
      setCollapsedSearchChapters((previous) => {
        const next = new Set(previous);
        if (chapterIsExpanded) next.add(chapterKey);
        else next.delete(chapterKey);
        return next;
      });

      if (!chapterIsExpanded) {
        setTimeout(() => {
          smoothScrollToElement(
            document.getElementById(`chapter-card-${chapterKey}`),
          );
        }, 50);
      }
      return;
    }

    setExpandedChapters((previous) => {
      const next = new Set(previous);
      if (next.has(chapterKey)) next.delete(chapterKey);
      else next.add(chapterKey);
      return next;
    });

    if (!chapterIsExpanded) {
      setTimeout(() => {
        smoothScrollToElement(
          document.getElementById(`chapter-card-${chapterKey}`),
        );
      }, 50);
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  useEffect(() => {
    if (!isSearching) setCollapsedSearchChapters(new Set());
  }, [isSearching]);

  const filteredChapters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const matchingChapters = chaptersData
      .map((chapter) => {
        const chapterText = `${chapter.name || ""} ${chapter.description || ""}`;
        const chapterNameMatches = chapterText.toLowerCase().includes(query);
        const subbabList = chapter.subbab || [];
        const filteredSubbab = subbabList.filter((subbab) => {
          const matchesGrade =
            selectedGrade === ALL_GRADES ||
            (subbab.classReference || "").toLowerCase() ===
              selectedGrade.toLowerCase();
          if (!matchesGrade) return false;
          if (!query) return true;
          return (
            (subbab.name || "").toLowerCase().includes(query) ||
            (subbab.description || "").toLowerCase().includes(query) ||
            chapterNameMatches
          );
        });

        return {
          ...chapter,
          filteredSubbab,
          filteredSubtopics: filteredSubbab,
          isMatch: !query || chapterNameMatches || filteredSubbab.length > 0,
        };
      })
      .filter((chapter) => chapter.isMatch);

    return matchingChapters.sort((left, right) => {
      const leftComplete = Number(left.progress || 0) >= 100;
      const rightComplete = Number(right.progress || 0) >= 100;
      if (leftComplete !== rightComplete) return leftComplete ? 1 : -1;

      const leftIsPriority = String(left._id) === String(priorityChapterId);
      const rightIsPriority = String(right._id) === String(priorityChapterId);
      if (leftIsPriority !== rightIsPriority) return leftIsPriority ? -1 : 1;
      return 0;
    });
  }, [chaptersData, searchQuery, selectedGrade, priorityChapterId]);

  const showPretestResult = async (chapter, pretestId) => {
    const response = await API.get(
      `/pretest/${pretestId}/result`,
      getAuthConfig(),
    );
    setActivePretestResult({
      chapterName: chapter.name,
      chapter: chapter,
      result: normalizePretestResult(response.data.data),
    });
    setPriorityChapterId(String(chapter._id || chapter.id));
  };

  const executeCompletePretest = (chapter) => {
    const chapterId = chapter._id || chapter.id;
    sessionStorage.setItem(
      TOPIC_RETURN_STATE_KEY,
      JSON.stringify({ searchQuery, selectedGrade }),
    );
    setPretestConfirmChapter(null);
    navigate(
      `/quiz?mode=pretest&babId=${encodeURIComponent(chapterId)}&chapterName=${encodeURIComponent(chapter.name || "Pretest")}`,
    );
  };

  const handleViewPretestResult = async (chapter) => {
    setPretestLoadingId(chapter._id);
    setLoadError("");
    try {
      const response = await API.get(
        `/pretest/status/${chapter._id}`,
        getAuthConfig(),
      );
      const pretestId = response.data.data.pretest_id;
      if (pretestId) await showPretestResult(chapter, pretestId);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Hasil pretest gagal dimuat.",
      );
    } finally {
      setPretestLoadingId(null);
    }
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

    const subbabId = subtopic._id || subtopic.id;
    sessionStorage.setItem(
      TOPIC_RETURN_STATE_KEY,
      JSON.stringify({ searchQuery, selectedGrade }),
    );
    navigate(
      `/quiz?mode=quiz&subbabId=${encodeURIComponent(subbabId)}&topicName=${encodeURIComponent(subtopic.name || "Kuis")}`,
    );
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      <Navbar activePage="Topik" />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-5 py-8 pb-24 sm:px-8 lg:px-10 md:pb-8">
          <TopHeader />
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

          {loadError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Memuat daftar kelas dan BAB...
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center">
              <h3 className="mb-1 text-sm font-bold text-slate-800">
                Tidak ada BAB yang cocok
              </h3>
              <p className="mx-auto mb-4 max-w-sm text-xs text-slate-500">
                Coba sesuaikan kata kunci pencarian atau ganti filter kelas.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGrade(ALL_GRADES);
                }}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                Reset Filter &amp; Pencarian
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredChapters.map((chapter) => (
                <ChapterCard
                  key={chapter._id}
                  chapter={chapter}
                  isSearching={isSearching}
                  expandedChapters={expandedChapters}
                  collapsedSearchChapters={collapsedSearchChapters}
                  toggleChapter={toggleChapter}
                  setPretestConfirmChapter={setPretestConfirmChapter}
                  handleViewPretestResult={handleViewPretestResult}
                  pretestLoading={pretestLoadingId === chapter._id}
                  selectedGrade={selectedGrade}
                  handleSubtopicAction={handleSubtopicAction}
                />
              ))}
            </div>
          )}
        </main>
      </div>

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