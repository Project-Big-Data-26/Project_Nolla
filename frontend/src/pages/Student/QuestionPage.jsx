import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

import smaIcon from "../../assets/icon/SMA.png";

const questions = [
  {
    id: 1,
    level: "Intermediate",
    topic: "Geometri",
    question: "Berapa panjang sisi AB dari segitiga di bawah ini?",
    image: smaIcon, // Ada Gambar
    options: [
      { label: "A", value: "6√2" },
      { label: "B", value: "3√2" },
      { label: "C", value: "12√2" },
      { label: "D", value: "3" },
    ],
    answer: "B",
    solution: "Menggunakan aturan sinus: AB / sin(C) = BC / sin(A)...",
  },
  {
    id: 2,
    level: "Beginner",
    topic: "Aljabar",
    question: "Berapakah nilai x jika x + 5 = 12?",
    image: null, // Tanpa Gambar
    options: [
      { label: "A", value: "5" },
      { label: "B", value: "6" },
      { label: "C", value: "7" },
      { label: "D", value: "8" },
    ],
    answer: "C",
    solution: "Kurangi 5 dari kedua sisi: x = 12 - 5 = 7.",
  },
  {
    id: 3,
    level: "Beginner",
    topic: "Pecahan",
    question: "Hitunglah hasil dari ½ + ¼",
    image: null, // Tanpa Gambar
    options: [
      { label: "A", value: "¾" },
      { label: "B", value: "⅙" },
      { label: "C", value: "⅔" },
      { label: "D", value: "½" },
    ],
    answer: "A",
    solution: "Samakan penyebut menjadi 4: 2/4 + 1/4 = 3/4.",
  },
];

const QuestionPage = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const question = questions[currentQuestion];
  const hasImage = Boolean(question.image);
  const isLastQuestion = currentQuestion === questions.length - 1;

  // Format Timer HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer Pengerjaan (Stopwatch)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectAnswer = (label) => {
    if (!checked) {
      setSelectedAnswer(label);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      navigate("/review-quiz");
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setChecked(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setChecked(false);
    }
  };

  return (
    <div className="flex h-screen max-h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      {/* Sidebar / Navbar Kiri */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 md:p-6 pb-20 md:pb-6 overflow-y-auto md:overflow-hidden">
        <div className="mx-auto w-full max-w-6xl flex flex-col h-full gap-3 sm:gap-4">
          {/* HEADER TOP: NOMOR SOAL & TIMER PENGERJAAN */}
          <div className="flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-100 shrink-0">
            {/* Navigasi Nomor Soal */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-1">
              {questions.map((q, idx) => {
                const isActive = idx === currentQuestion;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestion(idx);
                      setSelectedAnswer(null);
                      setChecked(false);
                    }}
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Timer Badge Waktu Pengerjaan */}
            <div className="bg-primary/10 border border-primary/20 px-3 py-1 sm:py-1.5 rounded-xl flex flex-col items-end shrink-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-primary uppercase tracking-wider">
                WAKTU PENGERJAAN
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-primary font-mono leading-none sm:leading-normal">
                {formatTime(timeElapsed)}
              </span>
            </div>
          </div>

          {/* DYNAMIC CONTENT AREA */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {hasImage ? (
              /* ================= CONDITIONAL 1: ADA GAMBAR ================= */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 h-full items-stretch">
                {/* KIRI: TEKS & GAMBAR SOAL */}
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shrink-0">
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                      {question.question}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 flex items-center justify-center flex-1 overflow-hidden">
                    <img
                      src={question.image}
                      alt="Ilustrasi Soal"
                      className="max-h-36 sm:max-h-52 md:max-h-60 max-w-full object-contain rounded-xl"
                    />
                  </div>
                </div>

                {/* KANAN: PILIHAN JAWABAN + BUTTON NAVIGASI LANGSUNG DI BAWAHNYA */}
                <div className="flex flex-col justify-between gap-3 bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6">
                  <div className="flex flex-col space-y-2.5 sm:space-y-3 justify-center flex-1">
                    {question.options.map((opt) => {
                      const isSelected = selectedAnswer === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleSelectAnswer(opt.label)}
                          className={`w-full flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-100"
                          }`}
                        >
                          <div
                            className={`h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                              isSelected
                                ? "bg-white text-primary"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {opt.label}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold flex-1">
                            {opt.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* NAVIGASI BUTTON: RESPONSIVE (JUSTIFY-BETWEEN MOBILE, MD:JUSTIFY-END DESKTOP) */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentQuestion === 0}
                      className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs sm:text-sm hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-hover transition-all cursor-pointer"
                    >
                      {isLastQuestion ? "Submit" : "Selanjutnya"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= CONDITIONAL 2: TANPA GAMBAR ================= */
              <div className="flex flex-col gap-3 sm:gap-4 h-auto">
                {/* CARD 1: TEKS SOAL */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shrink-0">
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                    {question.question}
                  </p>
                </div>

                {/* CARD 2: OPTION JAWABAN + BUTTON NAVIGASI LANGSUNG DI BAWAHNYA */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                    {question.options.map((opt) => {
                      const isSelected = selectedAnswer === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleSelectAnswer(opt.label)}
                          className={`w-full flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-100"
                          }`}
                        >
                          <div
                            className={`h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                              isSelected
                                ? "bg-white text-primary"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {opt.label}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold flex-1">
                            {opt.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* NAVIGASI BUTTON: RESPONSIVE */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentQuestion === 0}
                      className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs sm:text-sm hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-hover transition-all cursor-pointer"
                    >
                      {isLastQuestion ? "Submit" : "Selanjutnya"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionPage;
