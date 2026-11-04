import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "../../../components/Navbar";
import TopHeader from "../../../components/TopHeader";
import TopicSearchBar from "../../../components/SearchBar";
import ChapterCard from "../../../components/ChapterCard";
import TopicModals from "../../../components/TopicModals";
import Modal from "../../../components/Modal";
import PlanBanner from "../../../components/PlanBanner";
import TrialCallout from "../../../components/TrialCallout";
import crownIcon from "../../../assets/crown-icon.webp";
import API from "../../../api/axios";
import { track } from "../../../analytics/client";

const toSlug = (value, prefix) => {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[a-z]/.test(slug) ? slug.slice(0, 48) : `${prefix}_${slug}`.slice(0, 48);
};

const queryLengthBucket = (length) =>
  length <= 3 ? "1-3" : length <= 10 ? "4-10" : "11+";

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

const normalizeClassLabel = (value) =>
  String(value || "")
    .replace(/\s+(?:SD|SMA)\b/gi, "")
    .replace(/\s*\(Umum\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeBab = (bab, classInfo) => ({
  ...bab,
  _id: bab.id,
  diagnosticStatus: bab.has_pretest ? "completed" : "not_completed",
  classRange: normalizeClassLabel(
    bab.class_reference || classInfo?.name || "Kurikulum Nasional",
  ),
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

  // Setiap respons membawa entitlement yang sama (status paket user).
  if (!targetClasses.length) {
    const response = await API.get("/dashboard/bab", getAuthConfig());
    return {
      babList: (response.data.data || []).map((bab) => normalizeBab(bab)),
      entitlement: response.data.entitlement ?? null,
    };
  }

  const responses = await Promise.all(
    targetClasses.map((classInfo) =>
      API.get("/dashboard/bab", {
        ...getAuthConfig(),
        params: { kelas: classInfo.nomor_kelas },
      }),
    ),
  );

  return {
    babList: responses.flatMap((response, index) =>
      (response.data.data || []).map((bab) =>
        normalizeBab(bab, targetClasses[index]),
      ),
    ),
    entitlement: responses[0]?.data.entitlement ?? null,
  };
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
  const [gradeChoice, setGradeChoice] = useState(() => ({
    grade: returnTopicState.selectedGrade || ALL_GRADES,
    revision: 0,
  }));
  const selectedGrade = gradeChoice.grade;
  const gradeChoiceRef = useRef(gradeChoice);
  const pendingGradeChangeRef = useRef(null);
  const babRequestIdRef = useRef(0);
  const [loadedBabRequest, setLoadedBabRequest] = useState(null);

  const changeGrade = (grade) => {
    const previous = gradeChoiceRef.current;
    if (grade === previous.grade) return;
    const choice = { grade, revision: previous.revision + 1 };
    gradeChoiceRef.current = choice;
    pendingGradeChangeRef.current = choice;
    setGradeChoice(choice);
  };
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [availableGradeFilters, setAvailableGradeFilters] = useState([
    ALL_GRADES,
  ]);
  const [chaptersData, setChaptersData] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  // Dinaikkan setelah status paket berubah agar kunci & kuota dimuat ulang.
  const [planVersion, setPlanVersion] = useState(0);
  const [lockedChapter, setLockedChapter] = useState(null);
  // Konfirmasi trial menggantikan isi modal paket (satu modal, dua tampilan).
  const [isTrialConfirm, setIsTrialConfirm] = useState(false);
  const closeLockedModal = () => {
    setLockedChapter(null);
    setIsTrialConfirm(false);
  };
  const openLockedChapter = (chapter) => {
    setLockedChapter(chapter);
    setIsTrialConfirm(false);
  };
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
    const requestId = ++babRequestIdRef.current;
    const isActive = () =>
      isCurrent &&
      requestId === babRequestIdRef.current &&
      gradeChoice.revision === gradeChoiceRef.current.revision;

    const loadBab = async () => {
      setIsLoading(true);
      setLoadError("");
      setLoadedBabRequest(null);
      try {
        const { babList, entitlement: plan } = await fetchBabList(
          classes,
          selectedGrade,
        );
        if (!isActive()) return;
        setChaptersData(babList);
        setEntitlement(plan);
        setLoadedBabRequest({ ...gradeChoice, requestId });
      } catch (error) {
        if (!isActive()) return;
        setLoadError(
          error.response?.data?.message || "Daftar BAB gagal dimuat.",
        );
        setChaptersData([]);
      } finally {
        if (isActive()) setIsLoading(false);
      }
    };

    loadBab();
    return () => {
      isCurrent = false;
    };
  }, [classes, classesLoaded, selectedGrade, gradeChoice, planVersion]);

  const reloadPlan = useCallback(() => setPlanVersion((value) => value + 1), []);
  const handleTrialActivated = useCallback(
    (nextEntitlement) => {
      setEntitlement(nextEntitlement);
      setLockedChapter(null);
      setIsTrialConfirm(false);
      reloadPlan();
    },
    [reloadPlan],
  );

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

  // Pencarian: hanya panjang query (bucket) dan jumlah hasil, tanpa teks query.
  const searchTrackedRef = useRef(searchQuery);
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query === searchTrackedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      searchTrackedRef.current = query;
      track("topic_search_performed", {
        properties: {
          query_length_bucket: queryLengthBucket(query.length),
          result_count: filteredChapters.length,
        },
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [searchQuery, filteredChapters.length]);

  // Event menyatakan hasil filter yang sudah tampil, dengan request untuk aksi
  // yang sama. Nomor revisi membedakan A→B→A dari hasil A yang lebih lama.
  useEffect(() => {
    const pending = pendingGradeChangeRef.current;
    if (
      !pending ||
      !loadedBabRequest ||
      isLoading ||
      pending.revision !== gradeChoice.revision ||
      loadedBabRequest.revision !== pending.revision ||
      loadedBabRequest.grade !== selectedGrade ||
      loadedBabRequest.requestId !== babRequestIdRef.current
    ) return;
    track("topic_filter_changed", {
      properties: {
        filter_name: "kelas",
        filter_value: toSlug(selectedGrade, "kelas"),
        result_count: filteredChapters.length,
      },
    });
    pendingGradeChangeRef.current = null;
  }, [selectedGrade, gradeChoice.revision, loadedBabRequest, isLoading, filteredChapters.length]);

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
    track("topic_selected", {
      properties: { bab_id: String(chapterId), location: "pretest_start" },
    });
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
    track("topic_selected", {
      properties: {
        bab_id: String(chapter._id || chapter.id),
        subbab_id: String(subbabId),
        location: "subtopic_quiz",
      },
    });
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
        <main className="mx-auto max-w-6xl px-4 py-5 pb-24 sm:px-8 sm:py-8 lg:px-10 md:pb-8">
          <TopHeader />
          <TopicSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGrade={selectedGrade}
            setSelectedGrade={changeGrade}
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

          <PlanBanner entitlement={entitlement} onExpired={reloadPlan} />

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:px-5 sm:py-8 sm:text-sm">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <span>Memuat daftar kelas dan BAB...</span>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center sm:rounded-3xl sm:py-12">
              <h3 className="mb-1 text-sm font-bold text-slate-800">
                Tidak ada BAB yang cocok
              </h3>
              <p className="mx-auto mb-4 max-w-sm text-xs text-slate-500">
                Coba sesuaikan kata kunci pencarian atau ganti filter kelas.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  changeGrade(ALL_GRADES);
                }}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                Reset Filter &amp; Pencarian
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 sm:space-y-5">
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
                  onLockedClick={openLockedChapter}
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

      {lockedChapter && (
        <Modal
          onClose={closeLockedModal}
          maxWidth={isTrialConfirm ? "max-w-3xl" : "max-w-xl"}
          scrollable
        >
          {!isTrialConfirm && (
            <>
              <div className="mb-5">
                <div className="mb-1 flex items-center gap-2.5 pr-8">
                  <img
                    src={crownIcon}
                    alt=""
                    width="32"
                    height="32"
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <h3 className="text-lg font-bold text-slate-900">Bab terkunci</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  {lockedChapter.name} hanya tersedia dengan Premium. Paket Premium membuka semua bab dan memberi akses kuis tanpa batas.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="mb-2 text-sm font-semibold text-slate-800">Dengan Premium:</p>
                <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <li><span className="mr-2 text-primary">✓</span>Semua bab dan subbab terbuka</li>
                  <li><span className="mr-2 text-primary">✓</span>Kuis tanpa batas</li>
                </ul>
              </div>
            </>
          )}
          <div className={isTrialConfirm ? "" : "mt-5 grid w-full grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2"}>
            {!isTrialConfirm && (
              <button
                type="button"
                onClick={() => navigate("/paket")}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:brightness-95"
              >
                Lihat paket Premium
              </button>
            )}
            <TrialCallout
              entitlement={entitlement}
              onActivated={handleTrialActivated}
              onConfirmChange={setIsTrialConfirm}
              appearance="secondary"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Topics;
