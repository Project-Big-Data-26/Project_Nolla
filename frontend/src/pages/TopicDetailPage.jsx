import React from "react";
import { Link } from "react-router-dom";

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

import Navbar from "../components/Navbar";

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
    materiSelesai: 0,
  },
  {
    _id: "bab-005",
    kelas_id: "sd",
    name: "Perbandingan",
    description:
      "Mempelajari konsep perbandingan dan penggunaannya dalam menyelesaikan masalah matematika.",
    display_order: 5,
    progress: 0,
    totalMateri: 6,
    materiSelesai: 0,
  },
];

/* =========================================================
   STATUS BAB
   ========================================================= */

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

/* =========================================================
   CARD STATISTIK
   ========================================================= */

function StatCard({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}


function BabCard({ bab }) {
  const status = getStatus(bab.progress);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      
      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-start gap-4">

          {/* Nomor Bab */}

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
            {String(bab.display_order).padStart(2, "0")}
          </div>

          <div className="min-w-0">

            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Bab {bab.display_order}
            </p>

            <h3 className="text-lg font-bold text-slate-900">
              {bab.name}
            </h3>

          </div>

        </div>

        {/* Status */}

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>

      </div>

      {/* Deskripsi */}

      <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-500">
        {bab.description}
      </p>

      {/* Progress */}

      <div className="mt-5">

        <div className="mb-2 flex items-center justify-between text-xs">

          <span className="font-medium text-slate-500">
            Progress Belajar
          </span>

          <span className="font-semibold text-slate-700">
            {bab.progress}%
          </span>

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

      {/* Footer Card */}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

        <div className="text-xs text-slate-500">

          <span className="font-semibold text-slate-700">
            {bab.materiSelesai}
          </span>{" "}
          dari {bab.totalMateri} materi selesai

        </div>

        <Link
          to={`/topik/bab/${bab._id}`}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            bab.progress === 100
              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {bab.progress === 0 ? (
            <>
              Mulai
              <Play className="h-4 w-4" />
            </>
          ) : bab.progress === 100 ? (
            <>
              Lihat
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Lanjutkan
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Link>

      </div>

    </div>
  );
}


export default function TopikDetail() {

  const sortedBab = [...dataBab].sort(
    (a, b) => a.display_order - b.display_order
  );

  /* Statistik */

  const totalBab = sortedBab.length;

  const babSelesai = sortedBab.filter(
    (bab) => bab.progress === 100
  ).length;

  const babProgress = sortedBab.filter(
    (bab) => bab.progress > 0 && bab.progress < 100
  ).length;

  const totalPoin = 1250;

  const totalProgress =
    sortedBab.length > 0
      ? Math.round(
          sortedBab.reduce(
            (total, bab) => total + bab.progress,
            0
          ) / sortedBab.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">

      {/* Navbar dari components/Navbar.jsx */}

      <Navbar activePage="Topik" />

      {/* Konten */}

      <main className="min-w-0 flex-1">

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

          {/* Kembali */}

          <Link
            to="/topik"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Topik
          </Link>

          {/* Header Topik */}

          <section className="rounded-3xl bg-blue-600 p-7 text-white shadow-lg sm:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">

                <div className="mb-4 flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    Matematika
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    SD
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    Beginner
                  </span>

                </div>

                <h1 className="text-3xl font-bold sm:text-4xl">
                  Pecahan & Persentase
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Pelajari konsep pecahan, operasi pecahan,
                  desimal, perbandingan, dan persentase melalui
                  beberapa bab pembelajaran.
                </p>

              </div>

              {/* Progress Topik */}

              <div className="w-full rounded-2xl bg-white/10 p-5 lg:w-72">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-blue-100">
                    Progress Topik
                  </span>

                  <span className="text-lg font-bold">
                    {totalProgress}%
                  </span>

                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">

                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${totalProgress}%`,
                    }}
                  />

                </div>

                <p className="mt-3 text-xs text-blue-100">
                  {babSelesai} dari {totalBab} bab selesai
                </p>

              </div>

            </div>

          </section>

          {/* Statistik */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <StatCard
              icon={Trophy}
              title="Total Poin"
              value={totalPoin.toLocaleString("id-ID")}
              description="Poin yang telah kamu dapatkan"
            />

            <StatCard
              icon={CheckCircle2}
              title="Bab Selesai"
              value={`${babSelesai} Bab`}
              description={`Dari total ${totalBab} bab`}
            />

            <StatCard
              icon={Clock3}
              title="Sedang Dipelajari"
              value={`${babProgress} Bab`}
              description="Bab yang sedang kamu pelajari"
            />

          </section>

          {/* Bab Pembelajaran */}

          <section className="mt-10">

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  Materi Pembelajaran
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Bab Pembelajaran
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih bab untuk mulai belajar matematika.
                </p>

              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">

                <BookOpen className="h-4 w-4" />

                {totalBab} Bab

              </div>

            </div>

            {/* List Bab */}

            <div className="grid gap-5 lg:grid-cols-2">

              {sortedBab.map((bab) => (
                <BabCard
                  key={bab._id}
                  bab={bab}
                />
              ))}

            </div>

          </section>

          {/* Informasi */}

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
                  Selesaikan setiap bab untuk mendapatkan poin
                  dan meningkatkan pemahaman matematika kamu.
                </p>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}