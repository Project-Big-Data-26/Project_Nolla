import React from "react";
import {
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Award,
} from "lucide-react";
import SubbabItem from "./SubbabItem";

const ChapterCard = ({
  chapter,
  isSearching,
  expandedChapters,
  collapsedSearchChapters = new Set(),
  toggleChapter,
  setPretestConfirmChapter,
  handleViewPretestResult,
  pretestLoading,
  selectedGrade,
  handleSubtopicAction,
}) => {
  const chapterKey = chapter._id || chapter.id;
  const isExpanded =
    expandedChapters.has(chapterKey) ||
    (isSearching && !collapsedSearchChapters.has(chapterKey));
  const isPretestCompleted =
    chapter.has_pretest ?? chapter.diagnosticStatus === "completed";

  const chapterSubbabList = chapter.subbab || chapter.subtopics || [];
  const totalLessons = chapter.total_subbab ?? chapterSubbabList.length;
  const startedSubbabList = chapterSubbabList.filter(
    (subbab) =>
      subbab.started ||
      subbab.completed ||
      subbab.status === "in_progress" ||
      subbab.status === "completed",
  );
  const startedSubbabCount =
    chapter.started_subbab ?? startedSubbabList.length;
  const progressPercentage =
    startedSubbabList.length > 0 && totalLessons > 0
      ? Math.min(
          100,
          Math.round(
            (startedSubbabList.reduce((total, subbab) => {
              const elo = Number(
                subbab.current_cognitive_score ?? subbab.elo,
              );
              return total + (Number.isFinite(elo) ? Math.max(0, elo) : 0);
            }, 0) /
              (1600 * totalLessons)) *
              100,
          ),
        )
      : 0;

  const displaySubbab =
    chapter.filteredSubbab || chapter.filteredSubtopics || [];

  return (
    <article
      id={`chapter-card-${chapterKey}`}
      className={`bg-white border rounded-3xl transition-all duration-300 shadow-xs overflow-hidden ${
        isExpanded
          ? "border-primary/40 ring-1 ring-primary/10 shadow-sm"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          BAB {chapter.display_order || 1}
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mb-1">
          {chapter.name}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
          {chapter.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>
              {startedSubbabCount} dari {totalLessons} subbab dimulai
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Footer Card */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-3">
          <div className="text-[11px] font-medium text-slate-400">
            {chapter.classRange || "Kurikulum Nasional"}
          </div>

          <div>
            {!isPretestCompleted ? (
              <button
                onClick={() => setPretestConfirmChapter(chapter)}
                className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer hover:shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Mulai Pretest</span>
              </button>
            ) : (
              <button
                onClick={() => toggleChapter(chapter, isExpanded)}
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

      {/* Accordion List Subbab */}
      {isExpanded && isPretestCompleted && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-3 sm:p-6 space-y-3 sm:space-y-4 animate-in fade-in duration-300">
          {/* Pretest Result Card */}
          <div className="bg-white border border-emerald-200/90 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center mb-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Diagnostic Pretest: {chapter.name}
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Pretest selesai
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hasil pretest tersimpan. Kamu dapat meninjau analisis penguasaan
                materi dan rekomendasi belajar kapan saja.
              </p>
            </div>

            <div className="w-full shrink-0 sm:w-auto sm:self-center">
              <button
                onClick={() => handleViewPretestResult(chapter)}
                disabled={pretestLoading}
                className="w-full justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs sm:w-auto"
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  {pretestLoading ? "Memuat Hasil..." : "Lihat Hasil Pretest"}
                </span>
              </button>
            </div>
          </div>

          {/* Subbab List */}
          <div className="space-y-2.5">
            {displaySubbab.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                Tidak ada subbab di BAB ini untuk {selectedGrade}.
              </div>
            ) : (
              displaySubbab.map((subbab) => (
                <SubbabItem
                  key={subbab._id || subbab.id}
                  subbab={subbab}
                  chapter={chapter}
                  handleSubtopicAction={handleSubtopicAction}
                />
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default ChapterCard;
