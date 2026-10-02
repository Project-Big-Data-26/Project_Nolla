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
          buttonText: "Mulai",
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
          buttonText: "Mulai",
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
          buttonText: "Mulai",
          buttonClass:
            "bg-white hover:bg-slate-50 text-primary border border-primary/30 hover:border-primary font-semibold",
        };
    }
  };

  const { badge, buttonText, buttonClass } = renderStatusAndAction(
    subbab.status,
  );

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-5">
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-1">
        <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
          <span className="text-[11px] font-bold text-slate-400">
            Subbab {subbab.display_order || 1}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {subbab.classReference}
          </span>
          {badge}
        </div>

        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <span className="text-[11px] font-bold text-slate-400">
            Subbab {subbab.display_order || 1}
          </span>
          <h4 className="text-sm font-bold leading-snug text-slate-900">
            {subbab.name}
          </h4>
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {subbab.classReference}
          </span>
          {badge}
        </div>

        <h4 className="text-sm font-bold leading-snug text-slate-900 sm:hidden">
          {subbab.name}
        </h4>
        {subbab.description && (
          <p className="text-xs leading-relaxed text-slate-500">
            {subbab.description}
          </p>
        )}

        <p className="text-[11px] font-semibold text-slate-500">
          {subbab.current_cognitive_score ?? 1000} ·{" "}
          {subbab.current_cognitive_level ?? "medium"}
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

      <div className="flex w-full shrink-0 items-center sm:w-auto sm:self-center">
        <button
          onClick={() => handleSubtopicAction(subbab, chapter)}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs transition-all cursor-pointer sm:w-auto ${buttonClass}`}
        >
          <span>{buttonText}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SubbabItem;
