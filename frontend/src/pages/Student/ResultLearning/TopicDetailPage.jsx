import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
// 1. Import SearchBar secara konsisten
import SearchBar from "../../../components/SearchBar";
import Navbar from "../../../components/Navbar";
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Clock3,
  ChevronRight,
  Play,
  BookOpen,
  Target,
} from "lucide-react";

const dataBab = [
  {
    _id: "bab-001",
    kelas_id: "sd",
    name: "Pecahan Dasar",
    description:
      "Memahami konsep dasar pecahan, jenis pecahan, serta penerapannya dalam kehidupan sehari-hari.",
    display_order: 1,
    progress: 100,
    totalMateri: 5,
    materiSelesai: 5,
    classReference: "Kelas 4",
  },
  {
    _id: "bab-002",
    kelas_id: "sd",
    name: "Operasi Pecahan",
    description:
      "Mempelajari penjumlahan, pengurangan, perkalian, dan pembagian pada bilangan pecahan.",
    display_order: 2,
    progress: 65,
    totalMateri: 8,
    materiSelesai: 5,
    classReference: "Kelas 5",
  },
  {
    _id: "bab-003",
    kelas_id: "sd",
    name: "Pecahan Desimal",
    description:
      "Mengenal bilangan desimal serta hubungan antara pecahan biasa, pecahan desimal, dan persen.",
    display_order: 3,
    progress: 30,
    totalMateri: 6,
    materiSelesai: 2,
    classReference: "Kelas 5",
  },
  {
    _id: "bab-004",
    kelas_id: "sd",
    name: "Persentase",
    description:
      "Memahami konsep persentase dan menyelesaikan berbagai permasalahan persentase sederhana.",
    display_order: 4,
    progress: 0,
    totalMateri: 7,
    materiSelesai: 65,
    classReference: "Kelas 6",
  },
  {
    _id: "bab-005",
    kelas_id: "sd",
    name: "Perbandingan",
    description:
      "Mempelajari konsep perbandingan dan penggunaannya dalam menyelesaikan masalah matematika.",
    display_order: 5,
    progress: 50,
    totalMateri: 6,
    materiSelesai: 0,
    classReference: "Kelas 6",
  },
];

function getStatus(progress) {
  if (progress === 100) {
    return {
      label: "Selesai",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (progress > 0) {
    return {
      label: "Sedang Dipelajari",
      className: "bg-blue-50 text-blue-600",
    };
  }

  return {
    label: "Belum Mulai",
    className: "bg-slate-100 text-slate-500",
  };
}

function BabCard({ bab }) {
  const status = getStatus(bab.progress);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Bab {bab.display_order}
          </p>
          <h3 className="text-lg font-bold text-slate-900">{bab.name}</h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-500">
        {bab.description}
      </p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">Progress Belajar</span>
          <span className="font-semibold text-slate-700">{bab.progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              bab.progress === 100
                ? "bg-emerald-500"
                : bab.progress > 0
                  ? "bg-blue-600"
                  : "bg-slate-200"
            }`}
            style={{
              width: `${bab.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            {bab.materiSelesai}
          </span>{" "}
          dari {bab.totalMateri} materi selesai
        </div>
      </div>
    </div>
  );
}

export default function TopikDetail() {
  // 2. Definisi state filter & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Semua Kelas");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

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
    return dataBab
      .sort((a, b) => a.display_order - b.display_order)
      .filter((bab) => {
        const matchesSearch =
          bab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bab.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesGrade =
          selectedGrade === "Semua Kelas" ||
          (bab.classReference &&
            bab.classReference.toLowerCase() === selectedGrade.toLowerCase());

        return matchesSearch && matchesGrade;
      });
  }, [searchQuery, selectedGrade]);

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Navbar activePage="Topik" />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
          {/* Panggil SearchBar dengan props lengkap */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            filterDropdownRef={filterDropdownRef}
          />

          <section className="mt-10">
            {filteredBab.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">
                  Tidak ada bab yang cocok dengan pencarian/filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {filteredBab.map((bab) => (
                  <BabCard key={bab._id} bab={bab} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Terus tingkatkan kemampuanmu
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
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
