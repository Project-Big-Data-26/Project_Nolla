import React from "react";
import pretestIcon from "../assets/pretest-icon.webp";
import {
  X,
  ArrowRight,
  Award,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

const TopicModals = ({
  pretestConfirmChapter,
  setPretestConfirmChapter,
  executeCompletePretest,
  activePretestResult,
  setActivePretestResult,
  prerequisiteModal,
  setPrerequisiteModal,
  setSearchQuery,
  setBypassedChapterPrerequisites,
  setExpandedChapters,
}) => {
  return (
    <>
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

            <img
              src={pretestIcon}
              alt=""
              aria-hidden="true"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-3.5"
            />

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Mulai Diagnostic Pretest
            </h3>
            <p className="text-xs font-semibold text-primary mb-3">
              BAB: {pretestConfirmChapter.name}
            </p>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Pretest ini digunakan untuk memetakan pemahaman awalanmu sebelum
              membuka materi subbab. Setelah menyelesaikan pretest, daftar
              subbab akan otomatis terbuka.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  executeCompletePretest(pretestConfirmChapter);
                }}
                className="flex-1 py-2.5 px-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mulai atau Lanjutkan Pretest</span>
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

      {/* MODAL 2: HASIL PRETEST */}
      {activePretestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-xs animate-in fade-in sm:p-4">
          <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6">
            <button
              onClick={() => setActivePretestResult(null)}
              className="absolute right-3 top-3 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer sm:right-4 sm:top-4"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="mb-4 flex min-w-0 items-center gap-2.5 pr-8 sm:mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 sm:h-10 sm:w-10 sm:rounded-2xl">
                <Award className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="break-words text-sm font-semibold leading-snug text-slate-900 sm:text-base sm:font-bold">
                  Hasil Diagnostic Pretest
                </h3>
                <p className="break-words text-[11px] text-slate-500 sm:text-xs">
                  BAB: {activePretestResult.chapterName}
                </p>
              </div>
            </div>

            {/* STATISTIK HASIL PRETEST (Memakai UI baru, Data asli) */}
            {(() => {
              const correct = activePretestResult.result?.correctCount ?? 0;
              const wrong = activePretestResult.result?.wrongCount ?? 0;
              const total =
                activePretestResult.result?.totalQuestions ||
                correct + wrong ||
                15;
              const calculatedScore = activePretestResult.result?.score || 0;

              return (
                <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:mb-5 sm:gap-2.5 sm:rounded-2xl sm:p-3.5">
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
                      Skor Pretest
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-primary sm:text-xl sm:font-extrabold">
                      {calculatedScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
                      Benar / Salah
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-800 sm:text-sm sm:font-bold">
                      <span className="text-emerald-600 font-bold">
                        {correct}
                      </span>{" "}
                      / <span className="text-red-500 font-bold">{wrong}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
                      Durasi
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-800 sm:mt-1.5 sm:text-xs sm:font-bold">
                      {activePretestResult.result?.duration || "-"}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* BREAKDOWN MATERI PRASYARAT (Memakai UI baru, Data asli) */}
            {(() => {
              const rawPrereqs =
                activePretestResult.result?.prerequisiteBreakdown ||
                activePretestResult.result?.prerequisites ||
                [];

              return (
                <div className="mb-4 sm:mb-5">
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-800 sm:mb-2.5 sm:text-xs sm:font-bold">
                    Breakdown Prasyarat
                  </h4>
                  <div className="space-y-2">
                    {rawPrereqs.length > 0 ? (
                      rawPrereqs.map((item, idx) => {
                        const isMet =
                          item.status === "Terpenuhi" ||
                          item.status === "terpenuhi" ||
                          item.isMet === true ||
                          item.status === "completed";
                        return (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 sm:text-xs"
                          >
                            <span className="min-w-0 flex-1 break-words text-xs font-medium text-slate-700 sm:font-semibold">
                              {item.name || item.subtopic || item.title}
                            </span>
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isMet
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {isMet ? "Terpenuhi" : "Tidak Terpenuhi"}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-500">
                        Tidak ada materi prasyarat untuk bab ini.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* BREAKDOWN PEMAHAMAN PER SUBBAB (Memakai UI baru, Data asli) */}
            {activePretestResult.result?.breakdown && (
              <div className="mb-4 sm:mb-5">
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-800 sm:mb-2.5 sm:text-xs sm:font-bold">
                  Breakdown Pemahaman per Subbab
                </h4>
                <div className="space-y-2">
                  {activePretestResult.result.breakdown.map((item, idx) => {
                    const scoreValue = item.elo || item.score;
                    const scoreText = String(scoreValue ?? "");
                    const elo = scoreText.includes("%")
                      ? Math.round(
                          (Number.parseFloat(scoreText) / 100) * 1400,
                        )
                      : Number.parseFloat(scoreText.split("/")[0]) || 0;
                    const rawDifficulty = String(
                      item.difficulty || item.status || "",
                    ).toLowerCase();
                    const diffLower = ["easy", "medium", "hard"].includes(
                      rawDifficulty,
                    )
                      ? rawDifficulty
                      : elo >= 1200
                        ? "hard"
                        : elo >= 800
                          ? "medium"
                          : "easy";
                    const diffLabel =
                      diffLower === "hard"
                        ? "Hard"
                        : diffLower === "medium"
                          ? "Medium"
                          : "Easy";

                    const diffBadgeClass =
                      diffLower === "hard"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : diffLower === "medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200";

                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 sm:text-xs"
                      >
                        <span className="min-w-0 flex-1 break-words text-xs font-medium text-slate-700 sm:font-semibold">
                          {item.subtopic || item.name}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-600 sm:text-[11px]">
                            <span className="font-bold text-slate-800">
                              {elo}
                            </span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${diffBadgeClass}`}
                          >
                            {diffLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activePretestResult.result?.recommendation && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 sm:mb-5 sm:rounded-2xl sm:p-3.5">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary sm:font-bold">
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
              className="min-h-9 w-full rounded-2xl bg-primary py-2 text-[11px] font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer sm:min-h-10 sm:rounded-xl sm:py-2.5 sm:text-xs sm:font-bold"
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
                      prerequisiteModal.chapter._id ||
                      prerequisiteModal.chapter.id;
                    setBypassedChapterPrerequisites((prev) =>
                      new Set(prev).add(chapKey),
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
    </>
  );
};

export default TopicModals;
