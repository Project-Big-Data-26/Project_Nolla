import React from "react";
import {
  X,
  FileQuestion,
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

            <div className="grid grid-cols-3 gap-2.5 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Skor Pretest
                </p>
                <p className="text-xl font-extrabold text-primary mt-0.5">
                  {activePretestResult.result?.score === null ||
                  activePretestResult.result?.score === undefined
                    ? "-"
                    : `${activePretestResult.result.score}%`}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Benar / Salah
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  <span className="text-emerald-600">
                    {activePretestResult.result?.correctCount ?? 0}
                  </span>{" "}
                  /{" "}
                  <span className="text-red-500">
                    {activePretestResult.result?.wrongCount ?? 0}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Durasi</p>
                <p className="text-xs font-bold text-slate-800 mt-1.5">
                  {activePretestResult.result?.duration ?? "-"}
                </p>
              </div>
            </div>

            {Array.isArray(
              activePretestResult.result?.prerequisiteBreakdown,
            ) && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Breakdown Materi Prasyarat
                </h4>
                <div className="space-y-2">
                  {activePretestResult.result.prerequisiteBreakdown.length ? (
                    activePretestResult.result.prerequisiteBreakdown.map(
                      (item, idx) => {
                        const isMet = item.status === "terpenuhi";
                        return (
                          <div
                            key={`${item.name}-${idx}`}
                            className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs"
                          >
                            <span className="font-semibold text-slate-700">
                              {item.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isMet
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isMet ? "Terpenuhi" : "Tidak terpenuhi"}
                            </span>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <p className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-500">
                      Tidak ada materi prasyarat untuk bab ini.
                    </p>
                  )}
                </div>
              </div>
            )}

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
