import React from "react";
import { Search, X, SlidersHorizontal, Check, RotateCcw } from "lucide-react";

const Searchbar = ({
  searchQuery,
  setSearchQuery,
  selectedGrade,
  setSelectedGrade,
  isFilterOpen,
  setIsFilterOpen,
  filterDropdownRef,
  availableGradeFilters,
}) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Search Input */}
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

      {/* Filter Dropdown */}
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
  );
};

export default Searchbar;
