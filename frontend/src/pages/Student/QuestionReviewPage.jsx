import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { Check, X } from "lucide-react";

import Navbar from "../../components/Navbar";

import API from "../../api/axios";
import { track } from "../../analytics/client";
import QuestionImageGallery from "../../components/QuestionImageGallery";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex-v016";

import smaIcon from "../../assets/icon/SMA.webp";

import "katex-v016/dist/katex.min.css";

const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];
const inlineMarkdownComponents = {
  p: ({ children }) => <span>{children}</span>,
};
const markdownComponents = {
  p: ({ children }) => (
    <p className="my-1 first:mt-0 last:mb-0 sm:my-2">{children}</p>
  ),
  h1: ({ children }) => <h1 className="my-2 text-lg font-bold">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="my-2 text-base font-bold">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="my-2 text-sm font-bold">{children}</h3>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-300 px-2 py-1">{children}</td>
  ),
};
const normalizeMarkdown = (content) =>
  String(content ?? "")
    .replace(/\r\n|\n|\r/g, "\n")
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$\n${math}\n$$`);

const hasKatexError = (content) => {
  const formulas = content.matchAll(/(\${1,2})([\s\S]*?)\1/g);

  for (const [, delimiter, formula] of formulas) {
    try {
      katex.renderToString(formula, {
        displayMode: delimiter === "$$",
        throwOnError: true,
      });
    } catch {
      return true;
    }
  }

  return false;
};

const normalizeAiLatex = (content) =>
  content.replace(
    /\\\\(?=(?:left|right|frac|dfrac|tfrac|sqrt|text|mathrm|mathbf|overline|underline|cdot|times|div|sum|prod|int|alpha|beta|gamma|theta|pi|log|ln|sin|cos|tan)\b)/g,
    "\\",
  );

const getRenderableMarkdown = (content) => {
  const normalized = normalizeMarkdown(content);
  if (!hasKatexError(normalized)) return normalized;

  const aiNormalized = normalizeAiLatex(normalized);
  return aiNormalized !== normalized && !hasKatexError(aiNormalized)
    ? aiNormalized
    : normalized;
};

const reviewQuestions = [
  {
    id: 1,
    level: "Intermediate",
    topic: "Geometri",
    question: "Berapa panjang sisi AB dari segitiga di bawah ini?",
    image: smaIcon,
    options: [
      { label: "A", value: "6√2" },
      { label: "B", value: "3√2" },
      { label: "C", value: "12√2" },
      { label: "D", value: "3" },
    ],
    correctAnswer: "B",
    userAnswer: "B", // Benar
    timeSpent: "00:01:15",
    solution:
      "Menggunakan aturan sinus: AB / sin(C) = BC / sin(A). Diketahui sin(45°) = √2/2, sehingga hasil panjang AB = 3√2.",
  },
  {
    id: 2,
    level: "Beginner",
    topic: "Aljabar",
    question: "Berapakah nilai x jika x + 5 = 12?",
    image: null,
    options: [
      { label: "A", value: "5" },
      { label: "B", value: "6" },
      { label: "C", value: "7" },
      { label: "D", value: "8" },
    ],
    correctAnswer: "C",
    userAnswer: "A", // Salah (User pilih A, seharusnya C)
    timeSpent: "00:00:45",
    solution:
      "Kurangi angka 5 dari kedua ruas persamaan: x + 5 - 5 = 12 - 5, sehingga x = 7.",
  },
  {
    id: 3,
    level: "Beginner",
    topic: "Pecahan",
    question: "Hitunglah hasil dari ½ + ¼",
    image: null,
    options: [
      { label: "A", value: "¾" },
      { label: "B", value: "⅙" },
      { label: "C", value: "⅔" },
      { label: "D", value: "½" },
    ],
    correctAnswer: "A",
    userAnswer: "A", // Benar
    timeSpent: "00:00:30",
    solution:
      "Samakan penyebut kedua pecahan menjadi 4: ½ diubah menjadi 2/4. Kemudian 2/4 + 1/4 = 3/4.",
  },
];

const readPretestReview = (sessionId) => {
  if (!sessionId) return null;

  try {
    const stored = sessionStorage.getItem(`pretest-review:${sessionId}`);

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const formatResponseTime = (value) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "-";
  }

  const seconds = Math.max(0, Math.floor(Number(value)));
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

const QuestionReviewPage = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("sessionId");

  const reviewMode = searchParams.get("mode") === "quiz" ? "quiz" : "pretest";

  const routeTopicName =
    searchParams.get("topicName") ||
    searchParams.get("chapterName") ||
    (reviewMode === "quiz" ? "Kuis Subbab" : "Pretest");

  const [pretestReview] = useState(() =>
    reviewMode === "pretest" ? readPretestReview(sessionId) : null,
  );

  const [reviewData, setReviewData] = useState(pretestReview);

  const [reviewLoading, setReviewLoading] = useState(Boolean(sessionId));

  const [reviewError, setReviewError] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questionNumberNavRef = useRef(null);
  const questionContentRef = useRef(null);

  const [showQuizResult, setShowQuizResult] = useState(false);

  // review_viewed hanya untuk hasil nyata dari server, bukan data contoh/fallback.
  const [serverReviewLoaded, setServerReviewLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setReviewLoading(false);
      return undefined;
    }

    let isCurrent = true;

    const reviewEndpoint =
      reviewMode === "quiz"
        ? `/quiz/${sessionId}/review`
        : `/pretest/${sessionId}/review`;

    API.get(reviewEndpoint)
      .then((response) => {
        if (!isCurrent) return;

        const data = response.data.data;

        setReviewData({
          mode: reviewMode,
          sessionId: String(data.pretest_id || data.session_id),
          babId: data.bab_id ? String(data.bab_id) : null,
          subbabId: data.subbab_id ? String(data.subbab_id) : null,
          name: pretestReview?.name || routeTopicName,
          score: data.score,
          correct_answers: data.correct_answers ?? data.correct_count ?? 0,
          wrong_answers:
            data.wrong_answers ??
            data.wrong_count ??
            Math.max(
              0,
              (data.total_questions || 0) - (data.correct_count || 0),
            ),
          duration: data.duration,
          questions: (data.questions || []).map((item) => ({
            sequence: item.sequence,
            question: {
              id: String(item.question_id),
              stage: item.stage || null,
              text: item.question_text || "",
              images: Array.isArray(item.image_url)
                ? item.image_url
                : item.image_url
                  ? [item.image_url]
                  : [],
              options: (item.options || []).map((option) => ({
                id: String(option.option_id),
                text: option.text,
              })),
            },
            selectedAnswer: item.selected_answer,
            correctAnswer: item.correct_answer,
            isCorrect: item.is_correct,
            responseTime: item.response_time,
          })),
        });

        setReviewError("");
        setServerReviewLoaded(true);
      })
      .catch((error) => {
        if (isCurrent) {
          setReviewError(
            error.response?.data?.message || "Review soal gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setReviewLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [sessionId, reviewMode, routeTopicName, pretestReview?.name]);

  const questionsToReview = useMemo(() => {
    if (!reviewData) return reviewQuestions;

    return (reviewData.questions || []).map((item) => ({
      id: item.question.id,
      level: item.question.stage || "soal",
      topic: reviewData.name || "soal",
      question: item.question.text,
      images: item.question.images || [],
      options: item.question.options.map((option) => ({
        label: option.id,
        value: option.text,
      })),
      correctAnswer: item.correctAnswer ?? item.question.correct_answer ?? null,
      userAnswer: item.selectedAnswer,
      isCorrect: item.isCorrect ?? null,
      timeSpent: formatResponseTime(item.responseTime),
      solution: "",
    }));
  }, [reviewData]);

  const currentReviewQuestionId = questionsToReview[currentQuestion]?.id;

  useEffect(() => {
    if (questionContentRef.current) {
      questionContentRef.current.scrollTop = 0;
    }
  }, [currentReviewQuestionId]);

  useEffect(() => {
    const navigation = questionNumberNavRef.current;
    const activeButton = navigation?.querySelector(
      `[data-question-number="${currentQuestion + 1}"]`,
    );
    if (!navigation || !activeButton) return;

    const navigationRect = navigation.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const buttonLeft =
      buttonRect.left - navigationRect.left + navigation.scrollLeft;
    const buttonRight = buttonLeft + buttonRect.width;
    let nextScrollLeft = navigation.scrollLeft;

    if (buttonLeft < navigation.scrollLeft) {
      nextScrollLeft = buttonLeft;
    } else if (buttonRight > navigation.scrollLeft + navigation.clientWidth) {
      nextScrollLeft = buttonRight - navigation.clientWidth;
    } else {
      return;
    }

    navigation.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  }, [currentQuestion, questionsToReview.length]);

  const reviewedItem = reviewData?.questions?.[currentQuestion];

  useEffect(() => {
    if (!serverReviewLoaded || !reviewData?.sessionId) return;
    track("review_viewed", {
      assessmentType: reviewMode,
      attemptId: reviewData.sessionId,
      properties: showQuizResult
        ? { mode: "summary" }
        : {
            mode: "per_question",
            question_id: reviewedItem?.question.id,
            sequence: reviewedItem?.sequence,
          },
    });
  }, [
    serverReviewLoaded,
    reviewData?.sessionId,
    reviewMode,
    showQuizResult,
    reviewedItem?.question.id,
    reviewedItem?.sequence,
  ]);

  if (sessionId && reviewLoading && !reviewData) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar />

        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm font-semibold text-slate-600">
            Memuat review soal...
          </p>
        </main>
      </div>
    );
  }

  if (sessionId && reviewError && !reviewData) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar />

        <main className="flex flex-1 items-center justify-center p-6">
          <section className="max-w-md rounded-2xl border border-red-200 bg-white p-5">
            <p role="alert" className="text-sm text-red-700">
              {reviewError}
            </p>

            <button
              type="button"
              onClick={() => navigate("/topik")}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              Kembali ke topik
            </button>
          </section>
        </main>
      </div>
    );
  }

  const question = questionsToReview[currentQuestion];

  const hasImage = Boolean(question.images?.length);

  const isLastQuestion = currentQuestion === questionsToReview.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      if (reviewData) {
        if (reviewMode === "quiz") {
          setShowQuizResult(true);
          return;
        } else {
          const query = new URLSearchParams({
            pretestResultId: reviewData.sessionId,
            babId: reviewData.babId || "",
            chapterName: reviewData.name || "Pretest",
          });

          navigate(`/topik?${query.toString()}`);
        }
      } else {
        navigate("/student/result");
      }
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (showQuizResult && reviewData && reviewMode === "quiz") {
    const totalQuestions =
      reviewData.total_questions || questionsToReview.length;

    const correctCount = reviewData.correct_answers ?? 0;

    const wrongCount =
      reviewData.wrong_answers ?? Math.max(0, totalQuestions - correctCount);

    const scorePercentage = totalQuestions
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar />

        <main className="flex flex-1 items-center justify-center p-5 pb-24 md:pb-5">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase text-primary">
              Hasil Quiz
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              {reviewData.name || "Kuis Subbab"}
            </h1>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Skor</p>

                <p className="mt-1 text-xl font-extrabold text-primary">
                  {scorePercentage}%
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Benar / Salah</p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  <span className="text-emerald-700">{correctCount}</span>

                  {" / "}

                  <span className="text-rose-700">{wrongCount}</span>
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Durasi</p>

                <p className="mt-1 font-mono text-sm font-bold text-slate-800">
                  {formatResponseTime(reviewData.duration)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowQuizResult(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Lihat Review Jawaban
              </button>

              <button
                type="button"
                onClick={() => navigate("/topik")}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover"
              >
                Kembali ke Topik
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen w-full bg-neutral-bg font-sans overflow-hidden">
      <Navbar />

      <main className="flex flex-1 flex-col overflow-y-auto p-4 pb-20 sm:p-5 sm:pb-20 md:overflow-hidden md:p-6 md:pb-6">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-3 sm:gap-4">
          {/* HEADER TOP */}
          <div className="flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-100 shrink-0">
            <div
              ref={questionNumberNavRef}
              aria-label="Navigasi nomor soal review"
              className="no-scrollbar flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto scroll-smooth px-1 py-0.5 sm:gap-2"
            >
              {questionsToReview.map((q, idx) => {
                const isCorrect = reviewData
                  ? q.isCorrect === true
                  : q.userAnswer === q.correctAnswer;

                const isActive = idx === currentQuestion;

                const badgeBg = isCorrect
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-500 text-white";

                return (
                  <button
                    key={q.id}
                    data-question-number={idx + 1}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shrink-0 ${badgeBg} ${
                      isActive
                        ? "opacity-100 font-extrabold scale-105"
                        : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-100 border border-slate-200 px-3 py-1 sm:py-1.5 rounded-xl flex flex-col items-end shrink-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                WAKTU PENGERJAAN
              </span>

              <span className="text-right text-[10px] font-extrabold leading-tight text-slate-700 sm:text-sm">
                {reviewData
                  ? formatResponseTime(reviewData.duration)
                  : question.timeSpent}
              </span>
            </div>
          </div>

          {/* DYNAMIC CONTENT AREA */}
          <div
            ref={questionContentRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-3 md:pb-0"
          >
            {hasImage ? (
              /* ================= CONDITIONAL 1: ADA GAMBAR ================= */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 h-full items-stretch">
                {/* KIRI: TEKS & GAMBAR SOAL */}
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shrink-0">
                    <div className="min-w-0 text-justify text-[13px] leading-[1.55] font-medium text-slate-800 sm:text-left sm:text-sm sm:font-semibold md:text-base">
                      <ReactMarkdown
                        remarkPlugins={remarkPlugins}
                        rehypePlugins={rehypePlugins}
                        components={markdownComponents}
                      >
                        {getRenderableMarkdown(question.question)}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 flex min-h-0 items-center justify-center flex-1">
                    <QuestionImageGallery images={question.images} />
                  </div>
                </div>

                {/* KANAN: OPTION JAWABAN + PEMBAHASAN */}
                <div className="flex flex-col justify-between gap-3 bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6">
                  <div className="flex flex-col space-y-2.5 sm:space-y-3 justify-center flex-1">
                    {question.options.map((opt) => {
                      const isCorrectAnswer =
                        question.correctAnswer !== null &&
                        question.correctAnswer !== undefined
                          ? opt.label === String(question.correctAnswer)
                          : question.isCorrect === undefined
                            ? opt.label === question.correctAnswer
                            : question.isCorrect === true &&
                              opt.label === question.userAnswer;

                      const isUserWrongAnswer =
                        question.isCorrect === undefined
                          ? opt.label === question.userAnswer &&
                            !isCorrectAnswer
                          : question.isCorrect === false &&
                            opt.label === question.userAnswer;

                      let btnStyle =
                        "bg-slate-50/80 text-slate-700 border-slate-100";

                      let badgeStyle = "bg-slate-200/60 text-slate-600";

                      if (isCorrectAnswer) {
                        btnStyle = reviewData
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-white";

                        badgeStyle = reviewData
                          ? "bg-white text-emerald-700"
                          : "bg-white text-primary";
                      } else if (isUserWrongAnswer) {
                        btnStyle = "bg-rose-500 text-white";

                        badgeStyle = "bg-white text-rose-500";
                      }

                      return (
                        <div
                          key={opt.label}
                          className={`w-full flex items-start sm:items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl text-left border transition-all ${btnStyle}`}
                        >
                          <div
                            className={`mt-0.5 sm:mt-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${badgeStyle}`}
                          >
                            {opt.label}
                          </div>

                          <span className="min-w-0 flex-1 text-[13px] leading-relaxed font-medium sm:text-sm sm:font-semibold">
                            <ReactMarkdown
                              remarkPlugins={remarkPlugins}
                              rehypePlugins={rehypePlugins}
                              components={inlineMarkdownComponents}
                            >
                              {getRenderableMarkdown(opt.value)}
                            </ReactMarkdown>
                          </span>

                          {isCorrectAnswer && (
                            <Check className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
                          )}

                          {isUserWrongAnswer && (
                            <X className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* PEMBAHASAN / SOLUTION */}
                  {/* 
                  <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-2xl shrink-0 my-1">
                    <p className="text-xs font-bold text-primary mb-1">
                      💡 Pembahasan Soal:
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {question.solution}
                    </p>
                  </div>
                  */}

                  {/* NAVIGASI BUTTON */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentQuestion === 0}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed sm:min-h-10 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm sm:font-bold"
                    >
                      Sebelumnya
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-[11px] font-semibold text-white transition-all hover:bg-primary-hover cursor-pointer sm:min-h-10 sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-sm sm:font-bold"
                    >
                      {isLastQuestion
                        ? reviewMode === "quiz"
                          ? "Lihat Hasil"
                          : reviewData
                            ? "Kembali ke Topik"
                            : "Lihat Hasil"
                        : "Selanjutnya"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= CONDITIONAL 2: TANPA GAMBAR ================= */
              <div className="flex flex-col gap-3 sm:gap-4 h-auto">
                <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shrink-0">
                  <div className="min-w-0 text-justify text-[13px] leading-[1.55] font-medium text-slate-800 sm:text-left sm:text-sm sm:font-semibold md:text-base">
                    <ReactMarkdown
                      remarkPlugins={remarkPlugins}
                      rehypePlugins={rehypePlugins}
                      components={markdownComponents}
                    >
                      {getRenderableMarkdown(question.question)}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                    {question.options.map((opt) => {
                      const isCorrectAnswer =
                        question.correctAnswer !== null &&
                        question.correctAnswer !== undefined
                          ? opt.label === String(question.correctAnswer)
                          : question.isCorrect === undefined
                            ? opt.label === question.correctAnswer
                            : question.isCorrect === true &&
                              opt.label === question.userAnswer;

                      const isUserWrongAnswer =
                        question.isCorrect === undefined
                          ? opt.label === question.userAnswer &&
                            !isCorrectAnswer
                          : question.isCorrect === false &&
                            opt.label === question.userAnswer;

                      let btnStyle =
                        "bg-slate-50/80 text-slate-700 border-slate-100";

                      let badgeStyle = "bg-slate-200/60 text-slate-600";

                      if (isCorrectAnswer) {
                        btnStyle = reviewData
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-white";

                        badgeStyle = reviewData
                          ? "bg-white text-emerald-700"
                          : "bg-white text-primary";
                      } else if (isUserWrongAnswer) {
                        btnStyle = "bg-rose-500 text-white";

                        badgeStyle = "bg-white text-rose-500";
                      }

                      return (
                        <div
                          key={opt.label}
                          className={`w-full flex items-start sm:items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl text-left border transition-all ${btnStyle}`}
                        >
                          <div
                            className={`mt-0.5 sm:mt-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${badgeStyle}`}
                          >
                            {opt.label}
                          </div>

                          <span className="min-w-0 flex-1 text-[13px] leading-relaxed font-medium sm:text-sm sm:font-semibold">
                            <ReactMarkdown
                              remarkPlugins={remarkPlugins}
                              rehypePlugins={rehypePlugins}
                              components={inlineMarkdownComponents}
                            >
                              {getRenderableMarkdown(opt.value)}
                            </ReactMarkdown>
                          </span>

                          {isCorrectAnswer && (
                            <Check className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
                          )}

                          {isUserWrongAnswer && (
                            <X className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* PEMBAHASAN / SOLUTION */}
                  {/* 
                  <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-2xl shrink-0">
                    <p className="text-xs font-bold text-primary mb-1">
                      💡 Pembahasan Soal:
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {question.solution}
                    </p>
                  </div>
                  */}

                  {/* NAVIGASI BUTTON */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentQuestion === 0}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed sm:min-h-10 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm sm:font-bold"
                    >
                      Sebelumnya
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-[11px] font-semibold text-white transition-all hover:bg-primary-hover cursor-pointer sm:min-h-10 sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-sm sm:font-bold"
                    >
                      {isLastQuestion
                        ? reviewMode === "quiz"
                          ? "Lihat Hasil"
                          : reviewData
                            ? "Kembali ke Topik"
                            : "Lihat Hasil"
                        : "Selanjutnya"}
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

export default QuestionReviewPage;
