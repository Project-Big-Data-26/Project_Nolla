import React from "react";
import { ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";

const SubbabItem = ({ subbab, chapter, handleSubtopicAction }) => {
  const renderStatusAndAction = (status) => {
    switch (status) {
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

  const { badge, buttonText, buttonClass } = renderStatusAndAction(
    subbab.status,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-2xs">
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

        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
          {subbab.description}
        </p>

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
};

export default SubbabItem;
