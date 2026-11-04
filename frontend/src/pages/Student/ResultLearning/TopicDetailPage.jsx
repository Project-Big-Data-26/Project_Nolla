import React, { useState, useMemo, useRef, useEffect } from "react";
// 1. Import SearchBar secara konsisten
import SearchBar from "../../../components/SearchBar";
import TopHeaderIllustration from "../../../components/TopHeaderIllustration";
import Navbar from "../../../components/Navbar";
import { CheckCircle2, Clock3, Loader2, Target } from "lucide-react";
import API from "../../../api/axios";

const progressFilters = ["Semua", "Selesai", "Sedang Dipelajari"];

function LearningSummaryHeader({ summary }) {
  return (
    <section className="mb-5 sm:mb-7" aria-label="Ringkasan hasil belajar">
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border-b border-[#d6e5fb] bg-gradient-to-r from-[#eaf3fe] via-[#edf5fe] to-[#e5eefc] px-3.5 pb-3 pt-1.5 shadow-2xs sm:px-6 sm:pb-6 sm:pt-3">
        <div className="relative flex min-h-14 items-center justify-between gap-2 px-1 pb-1.5 sm:min-h-24 sm:gap-3 sm:px-2 sm:pb-5">
          <div>
            <h1 className="mt-1 text-[15px] font-bold leading-tight tracking-tight text-[#1d63ed] sm:text-3xl sm:font-extrabold">
              Hasil Pembelajaran
            </h1>
            <p className="mt-1 max-w-xl text-[11px] leading-snug text-slate-600 sm:mt-2 sm:text-sm sm:leading-relaxed">
              Pantau Perjalanan Belajarmu, Raih Targetmu Selangkah demi
              Selangkah!
            </p>
          </div>

          <div className="relative mr-1 hidden h-10 w-20 shrink-0 sm:mr-3 sm:h-24 sm:w-64 sm:block md:h-28 md:w-72">
            <TopHeaderIllustration />
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-1.5 border-t border-[#d6e5fb] pt-2.5 sm:grid-cols-2 sm:gap-4 sm:px-2 sm:pt-5">
          <article className="flex min-w-0 items-center justify-between gap-1 rounded-xl border border-[#d6e5fb] bg-white p-2 shadow-2xs sm:gap-3 sm:rounded-2xl sm:p-4">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 sm:h-8 sm:w-8">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-medium leading-tight text-slate-600 sm:text-sm sm:leading-snug">
                BAB Selesai Dipelajari
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold leading-none text-slate-900 sm:text-2xl">
              {summary.completed_bab}{" "}
              <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                BAB
              </span>
            </p>
          </article>

          <article className="flex min-w-0 items-center justify-between gap-1 rounded-xl border border-[#d6e5fb] bg-white p-2 shadow-2xs sm:gap-3 sm:rounded-2xl sm:p-4">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1d63ed] sm:h-8 sm:w-8">
                <Clock3 className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-medium leading-tight text-slate-600 sm:text-sm sm:leading-snug">
                BAB Sedang Dipelajari
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold leading-none text-slate-900 sm:text-2xl">
              {summary.in_progress_bab}{" "}
              <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                BAB
              </span>
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function BabCard({ bab }) {
  return (
    <article className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-sm">
      <div className="p-3.5 sm:p-6">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 sm:font-bold">
          BAB {bab.display_order || 1}
        </div>

        <h3 className="mb-1 break-words text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl sm:font-bold">
          {bab.name}
        </h3>

        <p className="mb-3 break-words text-xs leading-relaxed text-slate-500 sm:mb-4 sm:text-sm">
          {bab.description}
        </p>

        <div className="mb-3 sm:mb-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>
              {bab.started_subbab} dari {bab.total_subbab} subbab dimulai
            </span>
            <span className="text-xs font-medium text-slate-400 sm:text-[11px]">
              {bab.progress}%
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${bab.progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-t border-slate-100 pt-2.5 sm:pt-3">
          <div className="text-xs font-normal text-slate-400 sm:text-[11px] sm:font-medium">
            {(bab.class_reference || "Kurikulum Nasional").replace(/\s+(?:SD|SMA)\b/gi, "")}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TopikDetail() {
  // 2. Definisi state filter & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Semua");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const [babList, setBabList] = useState([]);
  const [summary, setSummary] = useState({
    completed_bab: 0,
    in_progress_bab: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadLearningResults = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await API.get("/learning-results");
        if (!isCurrent) return;

        setBabList(response.data.data || []);
        setSummary(
          response.data.summary || {
            completed_bab: 0,
            in_progress_bab: 0,
          },
        );
      } catch (error) {
        if (!isCurrent) return;
        setLoadError(
          error.response?.data?.message ||
            "Hasil pembelajaran gagal dimuat. Silakan coba lagi.",
        );
        setBabList([]);
        setSummary({ completed_bab: 0, in_progress_bab: 0 });
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadLearningResults();
    return () => {
      isCurrent = false;
    };
  }, []);

  // Click outside listener untuk menutup dropdown filter
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

  // 3. Filter data bab secara dinamis berdasarkan pencarian & pilihan kelas
  const filteredBab = useMemo(() => {
    return [...babList]
      .sort((a, b) => a.display_order - b.display_order)
      .filter((bab) => {
        const name = (bab.name || "").toLowerCase();
        const description = (bab.description || "").toLowerCase();
        const matchesSearch =
          name.includes(searchQuery.toLowerCase()) ||
          description.includes(searchQuery.toLowerCase());

        const matchesGrade =
          selectedGrade === "Semua" ||
          (selectedGrade === "Selesai" && bab.status === "completed") ||
          (selectedGrade === "Sedang Dipelajari" &&
            bab.status === "in_progress");

        return matchesSearch && matchesGrade;
      });
  }, [babList, searchQuery, selectedGrade]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar activePage="Topik" />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-5 pb-24 sm:px-8 sm:py-8 lg:px-10 md:pb-8">
          <LearningSummaryHeader summary={summary} />

          {/* Panggil SearchBar dengan props lengkap */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            filterDropdownRef={filterDropdownRef}
            filterOptions={progressFilters}
            filterDefaultValue="Semua"
            filterTitle="Filter Berdasarkan Progres"
          />

          {loadError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <section className="mt-6 sm:mt-10">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:px-5 sm:py-8 sm:text-sm">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                <span>Memuat hasil pembelajaran...</span>
              </div>
            ) : filteredBab.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white rounded-2xl border border-slate-200 sm:py-12">
                <p className="text-sm font-semibold text-slate-700">
                  Tidak ada bab yang cocok dengan pencarian/filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:gap-5 lg:grid-cols-2">
                {filteredBab.map((bab) => (
                  <BabCard key={bab.id} bab={bab} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-3.5 sm:mt-8 sm:p-5">
            <div className="flex gap-4">
              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 sm:flex sm:h-10 sm:w-10">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                  Terus tingkatkan kemampuanmu
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm sm:leading-6">
                  Selesaikan setiap bab untuk mendapatkan poin dan meningkatkan
                  pemahaman matematika kamu.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
