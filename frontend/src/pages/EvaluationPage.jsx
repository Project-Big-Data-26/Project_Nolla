import React from "react";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";

const EvaluationPage = () => {
  // Data dummy hasil pretest
  const score = 60;
  const correct = 6;
  const incorrect = 4;

  // Rekomendasi muncul jika nilai rendah
  const isLowScore = score < 70;

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Sidebar */}
      <Navbar />

      {/* Konten Utama */}
      <main className="flex-1 p-5 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <header className="mb-7">
          <p className="text-sm text-neutral-muted mb-1">
            Evaluasi Pretest
          </p>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-text">
            Hasil Evaluasi
          </h1>

          <p className="text-neutral-muted mt-2">
            Berikut adalah hasil pengerjaan pretest kamu.
          </p>
        </header>

        {/* Nilai Utama */}
        <section className="bg-primary rounded-3xl p-6 md:p-8 text-white mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm mb-2">
                NILAI PRETEST
              </p>

              <h2 className="text-5xl font-bold">
                {score}
              </h2>

              <p className="text-white/70 mt-2">
                dari 100 poin
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Trophy size={32} />
            </div>
          </div>
        </section>

        {/* Statistik Jawaban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Jawaban Benar */}
          <div className="bg-neutral-card rounded-2xl p-6 border border-neutral-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2
                  size={24}
                  className="text-green-600"
                />
              </div>

              <div>
                <p className="text-sm text-neutral-muted">
                  Jawaban Benar
                </p>

                <p className="text-2xl font-bold text-neutral-text">
                  {correct}
                </p>
              </div>
            </div>
          </div>

          {/* Jawaban Salah */}
          <div className="bg-neutral-card rounded-2xl p-6 border border-neutral-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle
                  size={24}
                  className="text-red-600"
                />
              </div>

              <div>
                <p className="text-sm text-neutral-muted">
                  Jawaban Salah
                </p>

                <p className="text-2xl font-bold text-neutral-text">
                  {incorrect}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rekomendasi Materi Prasyarat */}
        {isLowScore && (
          <section className="bg-neutral-card rounded-2xl p-6 border border-neutral-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <BookOpen
                  size={24}
                  className="text-blue-600"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-neutral-text">
                  Rekomendasi Materi Prasyarat
                </h2>

                <p className="text-sm text-neutral-muted mt-1">
                  Nilai pretest kamu masih perlu ditingkatkan.
                  Sebaiknya pelajari kembali materi berikut sebelum
                  melanjutkan.
                </p>

                <div className="mt-4 flex items-center justify-between bg-neutral-bg rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-neutral-text">
                      Operasi Bilangan Dasar
                    </p>

                    <p className="text-xs text-neutral-muted mt-1">
                      Materi prasyarat yang direkomendasikan
                    </p>
                  </div>

                  <ArrowRight
                    size={20}
                    className="text-primary"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default EvaluationPage;