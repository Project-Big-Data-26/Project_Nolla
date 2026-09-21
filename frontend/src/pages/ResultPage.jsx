import React from "react";
import { ArrowLeft, ArrowRight, Target, Flame } from "lucide-react";
import Navbar from "../components/Navbar";
import SectionCard from "../components/SectionCard";
import ResultQuestionCard from "../components/ResultQuestionCard";

const ResultPage = () => {
  const results = [
    {
      id: 1,
      level: "Pemula",
      topic: "Pecahan & Persentase",
      question: (
        <>
          Hitunglah{" "}
          <span className="inline-flex flex-col items-center align-middle leading-none mx-1">
            <span>1</span>
            <span className="w-5 border-t border-current my-[2px]" />
            <span>2</span>
          </span>{" "}
          +{" "}
          <span className="inline-flex flex-col items-center align-middle leading-none mx-1">
            <span>1</span>
            <span className="w-5 border-t border-current my-[2px]" />
            <span>4</span>
          </span>
        </>
      ),
      options: [
        {
          label: "A",
          value: (
            <span className="inline-flex flex-col items-center leading-none">
              <span>3</span>
              <span className="w-5 border-t border-current my-[2px]" />
              <span>4</span>
            </span>
          ),
          correct: true,
        },
        {
          label: "B",
          value: (
            <span className="inline-flex flex-col items-center leading-none">
              <span>1</span>
              <span className="w-5 border-t border-current my-[2px]" />
              <span>6</span>
            </span>
          ),
          correct: false,
        },
        {
          label: "C",
          value: (
            <span className="inline-flex flex-col items-center leading-none">
              <span>2</span>
              <span className="w-5 border-t border-current my-[2px]" />
              <span>6</span>
            </span>
          ),
          correct: false,
        },
        {
          label: "D",
          value: (
            <span className="inline-flex flex-col items-center leading-none">
              <span>1</span>
              <span className="w-5 border-t border-current my-[2px]" />
              <span>2</span>
            </span>
          ),
          correct: false,
        },
      ],
      selectedAnswer: "A",
      explanation: (
        <>
          Samakan penyebut menjadi 4.
          <br />
          <span className="font-medium">1/2 = 2/4</span>, sehingga:
          <br />
          <span className="font-medium">2/4 + 1/4 = 3/4</span>.
        </>
      ),
    },

    {
      id: 2,
      level: "Pemula",
      topic: "Operasi Bilangan",
      question: (
        <>
          Berapakah hasil dari <span className="font-medium">8 × 7</span>?
        </>
      ),
      options: [
        {
          label: "A",
          value: "54",
          correct: false,
        },
        {
          label: "B",
          value: "56",
          correct: true,
        },
        {
          label: "C",
          value: "64",
          correct: false,
        },
        {
          label: "D",
          value: "48",
          correct: false,
        },
      ],
      selectedAnswer: "A",
      explanation: (
        <>
          Perkalian <span className="font-medium">8 × 7</span> menghasilkan{" "}
          <span className="font-medium">56</span>.
        </>
      ),
    },

    {
      id: 3,
      level: "Pemula",
      topic: "Persamaan Sederhana",
      question: (
        <>
          Jika <span className="font-medium">x + 5 = 12</span>, maka nilai x
          adalah ...
        </>
      ),
      options: [
        {
          label: "A",
          value: "5",
          correct: false,
        },
        {
          label: "B",
          value: "6",
          correct: false,
        },
        {
          label: "C",
          value: "7",
          correct: true,
        },
        {
          label: "D",
          value: "8",
          correct: false,
        },
      ],
      selectedAnswer: "C",
      explanation: (
        <>
          Kurangi kedua sisi dengan 5.
          <br />
          <span className="font-medium">x = 12 - 5</span>
          <br />
          Jadi, <span className="font-medium">x = 7</span>.
        </>
      ),
    },
  ];

  const correctCount = results.filter((result) => {
    const selected = result.options.find(
      (option) => option.label === result.selectedAnswer,
    );

    return selected?.correct;
  }).length;

  const totalQuestions = results.length;

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const handleBack = () => {
    console.log("Kembali ke halaman pengerjaan");
  };

  const handleEvaluation = () => {
    console.log("Buka halaman evaluasi");
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Navbar yang sudah ada di project */}
      <Navbar />

      {/* Konten utama */}
      <main className="flex-1 p-5 md:p-8 pb-24 md:pb-8">
        {/* HEADER */}
        <header className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target size={17} className="text-primary" />
            </div>

            <span className="text-sm text-neutral-muted">Hasil Latihan</span>
          </div>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-text">
            Hasil Pengerjaan
          </h1>

          <p className="text-neutral-muted mt-2">
            Lihat hasil jawaban kamu pada latihan matematika ini.
          </p>
        </header>

        {/* RINGKASAN HASIL */}
        <SectionCard as="section" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-neutral-muted mb-1">
                Latihan selesai
              </p>

              <h2 className="text-xl font-bold text-neutral-text">
                Pecahan & Persentase
              </h2>

              <p className="text-sm text-neutral-muted mt-2">
                Kamu telah menyelesaikan semua soal pada latihan ini.
              </p>
            </div>

            <div className="flex items-center gap-5">
              {/* NILAI */}
              <div className="text-center">
                <p className="text-sm text-neutral-muted">Nilai</p>

                <p className="text-3xl font-bold text-primary mt-1">
                  {percentage}
                </p>
              </div>

              {/* BENAR */}
              <div className="h-12 w-px bg-neutral-border" />

              <div className="text-center">
                <p className="text-sm text-neutral-muted">Benar</p>

                <p className="text-2xl font-bold text-green-600 mt-1">
                  {correctCount}/{totalQuestions}
                </p>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-muted">
                Persentase jawaban benar
              </span>

              <span className="font-semibold text-primary">
                {percentage}%
              </span>
            </div>

            <div className="h-2.5 bg-neutral-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        </SectionCard>

        {/* STATUS */}
        <div className="flex items-center gap-3 mb-5">
          <Flame size={20} className="text-orange-500" />

          <div>
            <h2 className="text-lg font-bold text-neutral-text">
              Detail Jawaban
            </h2>

            <p className="text-sm text-neutral-muted">
              Periksa jawaban benar dan jawaban yang masih perlu dipelajari.
            </p>
          </div>
        </div>

        {/* HASIL PER SOAL */}
        <div className="space-y-5">
          {results.map((result) => (
            <ResultQuestionCard key={result.id} result={result} />
          ))}
        </div>

        {/* BUTTON BAWAH */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7">
          {/* KEMBALI */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-neutral-border bg-neutral-card text-neutral-text font-semibold hover:bg-neutral-bg transition"
          >
            <ArrowLeft size={18} />
            Kembali ke Latihan
          </button>

          {/* LIHAT EVALUASI */}
          <button
            type="button"
            onClick={handleEvaluation}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition"
          >
            Lihat Evaluasi
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;