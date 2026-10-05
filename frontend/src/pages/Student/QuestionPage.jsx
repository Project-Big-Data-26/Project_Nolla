import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";
import QuestionImage from "../../components/QuestionImage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex-v016/dist/katex.min.css";

const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];
const inlineMarkdownComponents = {
  p: ({ children }) => <span>{children}</span>,
};
const markdownComponents = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="my-2 text-lg font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="my-2 text-base font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="my-2 text-sm font-bold">{children}</h3>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
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
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$\n${math}\n$$`);

// ================================
// SESSION STORAGE
// ================================
const readSessionValue = (key, fallback) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// ================================
// NORMALIZE QUESTION
// ================================
const normalizeQuestion = (question) => ({
  id: String(question.question_id || question._id),

  text: question.question_text || question.soal_text || "",

  stage: question.stage || null,

  options: (question.options || []).map((option) => ({
    id: String(option.option_id ?? option.label ?? option.text),
    text: option.text ?? option.value ?? "",
  })),

  images: Array.isArray(question.image_url)
    ? question.image_url
    : question.image_url
      ? [question.image_url]
      : [],
});

// ================================
// QUESTION PAGE
// ================================
const QuestionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode") === "pretest" ? "pretest" : "quiz";

  const babId = searchParams.get("babId");
  const subbabId = searchParams.get("subbabId");

  const chapterName = searchParams.get("chapterName") || "Pretest";

  const topicName = searchParams.get("topicName") || "Kuis Subbab";

  const routeKey = `${mode}:${babId || ""}:${subbabId || ""}`;

  // ================================
  // STATE
  // ================================
  const [loading, setLoading] = useState(true);
  const [retryVersion, setRetryVersion] = useState(0);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedSequence, setViewedSequence] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [now, setNow] = useState(0);

  const initializationRef = useRef(null);

  // ================================
  // TIMER
  // ================================
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  // ================================
  // INITIALIZE
  // ================================
  useEffect(() => {
    let isCurrent = true;

    const initialize = async () => {
      setLoading(true);
      setError("");
      setResult(null);
      setSession(null);
      setQuestions([]);
      setHistory([]);
      setAnswers({});
      setSelectedAnswer(null);
      setCurrentIndex(0);
      setViewedSequence(null);

      try {
        // ============================================
        // PRETEST
        // ============================================
        if (mode === "pretest") {
          if (!babId) {
            throw new Error("ID bab pretest tidak ditemukan.");
          }

          const statusResponse = await API.get(`/pretest/status/${babId}`);

          const statusData = statusResponse.data.data;

          if (statusData.status === "completed") {
            const pretestId = String(statusData.pretest_id);

            if (readSessionValue(`pretest-review:${pretestId}`, null)) {
              return {
                navigateToReview: `/review-quiz?mode=pretest&sessionId=${encodeURIComponent(
                  pretestId,
                )}`,
                session: null,
              };
            }

            const resultResponse = await API.get(
              `/pretest/${pretestId}/result`,
            );

            return {
              result: resultResponse.data.data,
              session: null,
            };
          }

          let pretestId = statusData.pretest_id;
          let questionData;
          let sequence = 1;
          let totalQuestions;
          let startedAt;

          if (statusData.status === "active") {
            const questionResponse = await API.get(
              `/pretest/${pretestId}/question`,
            );

            questionData = questionResponse.data.data.question;

            sequence = questionResponse.data.data.sequence || 1;

            totalQuestions = questionResponse.data.data.total_questions;
          } else {
            const startResponse = await API.post("/pretest/start", {
              bab_id: babId,
            });

            const startData = startResponse.data.data;

            pretestId = startData.pretest_id;

            questionData = startData.first_question;

            totalQuestions = startData.total_questions;

            startedAt = startData.started_at
              ? new Date(startData.started_at).getTime()
              : Date.now();
          }

          if (!pretestId) {
            throw new Error("Sesi pretest tidak dapat dimuat.");
          }

          const storageKey = `pretest:${pretestId}`;

          const stored = readSessionValue(storageKey, {});

          const savedHistory = Array.isArray(stored.history)
            ? stored.history
            : [];

          const sessionStartedAt = stored.startedAt || startedAt || Date.now();

          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              ...stored,
              history: savedHistory,
              startedAt: sessionStartedAt,
            }),
          );

          if (!questionData) {
            throw new Error(
              "Soal pretest belum tersedia. Tekan Coba lagi untuk memuat ulang soal.",
            );
          }

          return {
            session: {
              mode: "pretest",
              id: String(pretestId),
              babId,
              name: chapterName,
              question: normalizeQuestion(questionData),
              sequence,
              totalQuestions,
              progress: Math.round(((sequence - 1) / totalQuestions) * 100),
              startedAt: sessionStartedAt,
            },

            history: savedHistory,

            selectedAnswer:
              stored.draftQuestionId === String(questionData.question_id)
                ? (stored.draftAnswer ?? null)
                : null,
          };
        }

        // ============================================
        // QUIZ
        // ============================================
        if (!subbabId) {
          throw new Error("ID subbab kuis tidak ditemukan.");
        }

        const startResponse = await API.post("/quiz/start", {
          subbab_id: subbabId,
        });

        const startData = startResponse.data.data;

        const sessionId = String(startData.session_id);

        const storageKey = `quiz:${sessionId}`;

        const stored = readSessionValue(storageKey, {});

        const normalizedQuestions = (startData.questions || []).map(
          normalizeQuestion,
        );

        const validQuestionIds = new Set(
          normalizedQuestions.map((question) => question.id),
        );

        const savedAnswers = Object.fromEntries(
          Object.entries(stored.answers || {}).filter(([questionId]) =>
            validQuestionIds.has(questionId),
          ),
        );

        const sessionStartedAt =
          stored.startedAt ||
          (startData.started_at
            ? new Date(startData.started_at).getTime()
            : Date.now());

        const savedIndex = Math.min(
          Math.max(Number(stored.currentIndex) || 0, 0),
          Math.max(normalizedQuestions.length - 1, 0),
        );

        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            ...stored,
            answers: savedAnswers,
            currentIndex: savedIndex,
            startedAt: sessionStartedAt,
          }),
        );

        return {
          session: {
            mode: "quiz",
            id: sessionId,
            subbabId,
            name: topicName,
            startedAt: sessionStartedAt,
          },

          questions: normalizedQuestions,

          answers: savedAnswers,

          currentIndex: savedIndex,
        };
      } catch (requestError) {
        throw new Error(
          requestError.response?.data?.message ||
            requestError.message ||
            "Sesi soal gagal dimuat.",
        );
      }
    };

    if (initializationRef.current?.key !== `${routeKey}:${retryVersion}`) {
      initializationRef.current = {
        key: `${routeKey}:${retryVersion}`,
        promise: initialize(),
      };
    }

    initializationRef.current.promise
      .then((data) => {
        if (!isCurrent) return;

        if (data.navigateToReview) {
          navigate(data.navigateToReview);
          return;
        }

        setSession(data.session || null);

        setQuestions(data.questions || []);

        setHistory(data.history || []);

        setAnswers(data.answers || {});

        setCurrentIndex(data.currentIndex || 0);

        setSelectedAnswer(data.selectedAnswer ?? null);

        setQuestionStartedAt(Date.now());

        if (data.result) {
          setResult(data.result);
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    mode,
    babId,
    subbabId,
    chapterName,
    topicName,
    routeKey,
    retryVersion,
    navigate,
  ]);

  // ================================
  // CURRENT QUESTION
  // ================================
  const storageKey = session ? `${session.mode}:${session.id}` : null;

  const activePretestSequence =
    session?.mode === "pretest" ? session.sequence : 0;

  const displaySequence = viewedSequence ?? activePretestSequence;

  const historicalAnswer =
    session?.mode === "pretest"
      ? history.find((item) => item.sequence === displaySequence)
      : null;

  const question =
    session?.mode === "pretest"
      ? displaySequence < activePretestSequence
        ? historicalAnswer?.question
        : session.question
      : questions[currentIndex];

  const isHistoricalPretestQuestion =
    session?.mode === "pretest" && displaySequence < activePretestSequence;

  const currentAnswer =
    session?.mode === "pretest"
      ? isHistoricalPretestQuestion
        ? historicalAnswer?.selectedAnswer
        : selectedAnswer
      : question
        ? (answers[question.id] ?? null)
        : null;

  // ================================
  // TIMER
  // ================================
  const elapsedSeconds = session?.startedAt
    ? Math.max(0, Math.floor((now - session.startedAt) / 1000))
    : 0;

  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);

    const minutes = Math.floor((elapsedSeconds % 3600) / 60);

    const seconds = elapsedSeconds % 60;

    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }, [elapsedSeconds]);

  // ================================
  // PERSIST PRETEST
  // ================================
  const persistPretest = (pretestId, nextHistory, startedAt, draft = {}) => {
    sessionStorage.setItem(
      `pretest:${pretestId}`,
      JSON.stringify({
        history: nextHistory,
        startedAt,
        ...draft,
      }),
    );
  };

  // ================================
  // FINISH PRETEST
  // ================================
  const finishPretest = async (pretestId, reviewHistory, name, babId) => {
    await API.post(`/pretest/${pretestId}/submit`, {});

    const resultResponse = await API.get(`/pretest/${pretestId}/result`);

    sessionStorage.setItem(
      `pretest-review:${pretestId}`,
      JSON.stringify({
        sessionId: String(pretestId),
        babId: String(babId),
        name,
        questions: reviewHistory,
        result: resultResponse.data.data,
      }),
    );

    sessionStorage.removeItem(`pretest:${pretestId}`);

    navigate(
      `/review-quiz?mode=pretest&sessionId=${encodeURIComponent(pretestId)}`,
    );
  };

  // ================================
  // PRETEST ANSWER
  // ================================
  const handlePretestAnswer = async () => {
    if (
      !session ||
      session.mode !== "pretest" ||
      !selectedAnswer ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    const answeredQuestion = session.question;

    const selectedOption = selectedAnswer;

    const nextHistory = [
      ...history.filter((item) => item.sequence !== session.sequence),
      {
        sequence: session.sequence,
        question: answeredQuestion,
        selectedAnswer: selectedOption,
      },
    ].sort((left, right) => left.sequence - right.sequence);

    try {
      const response = await API.post(`/pretest/${session.id}/answer`, {
        question_id: answeredQuestion.id,

        selected_answer: selectedOption,

        response_time: Math.max(
          0,
          Math.round((Date.now() - questionStartedAt) / 1000),
        ),
      });

      const answerData = response.data.data;

      const completedHistory = nextHistory.map((item) =>
        item.sequence === session.sequence
          ? {
              ...item,
              isCorrect: answerData.is_correct ?? null,
            }
          : item,
      );

      persistPretest(session.id, completedHistory, session.startedAt);

      setHistory(completedHistory);

      if (!answerData.next_question) {
        setSession((previous) => ({
          ...previous,
          lastQuestionSubmitted: true,
        }));

        setSelectedAnswer(null);

        await finishPretest(
          session.id,
          completedHistory,
          session.name,
          session.babId,
        );

        return;
      }

      setSession((previous) => ({
        ...previous,
        question: normalizeQuestion(answerData.next_question),
        sequence: answerData.next_question_sequence,
        totalQuestions: answerData.total_questions,
        progress: answerData.progress,
      }));

      setSelectedAnswer(null);
      setViewedSequence(null);
      setQuestionStartedAt(Date.now());
    } catch (requestError) {
      try {
        const recoveryResponse = await API.get(
          `/pretest/${session.id}/question`,
        );

        const recovered = recoveryResponse.data.data;

        if (!recovered.question) {
          persistPretest(session.id, nextHistory, session.startedAt);

          setHistory(nextHistory);

          setSession((previous) => ({
            ...previous,
            lastQuestionSubmitted: true,
          }));

          setSelectedAnswer(null);
          return;
        }

        if (recovered.question.question_id !== answeredQuestion.id) {
          persistPretest(session.id, nextHistory, session.startedAt);

          setHistory(nextHistory);

          setSession((previous) => ({
            ...previous,
            question: normalizeQuestion(recovered.question),
            sequence: recovered.sequence,
            totalQuestions: recovered.total_questions,
            progress: Math.round(
              ((recovered.sequence - 1) / recovered.total_questions) * 100,
            ),
            lastQuestionSubmitted: false,
          }));

          setSelectedAnswer(null);
          setViewedSequence(null);
          setQuestionStartedAt(Date.now());

          return;
        }
      } catch {
        // Keep selected answer available
      }

      setError(
        requestError.response?.data?.message ||
          "Jawaban belum berhasil dikirim. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================
  // RETRY PRETEST SUBMIT
  // ================================
  const retryPretestSubmit = async () => {
    if (!session || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await finishPretest(session.id, history, session.name, session.babId);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Pretest belum dapat diselesaikan. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================
  // PRETEST OPTION SELECT
  // ================================
  const handlePretestOptionSelect = (optionId) => {
    setSelectedAnswer(optionId);

    persistPretest(session.id, history, session.startedAt, {
      draftQuestionId: session.question.id,

      draftAnswer: optionId,
    });
  };

  // ================================
  // QUIZ ANSWER
  // ================================
  const handleQuizAnswer = (optionId) => {
    if (!question || !storageKey) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [question.id]: optionId,
    };

    setAnswers(nextAnswers);

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        answers: nextAnswers,

        currentIndex,

        startedAt: session.startedAt,
      }),
    );
  };

  // ================================
  // QUIZ NAVIGATION
  // ================================
  const handleQuizNavigation = (nextIndex) => {
    setCurrentIndex(nextIndex);

    setQuestionStartedAt(now);

    if (!storageKey) {
      return;
    }

    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        answers,

        currentIndex: nextIndex,

        startedAt: session.startedAt,
      }),
    );
  };

  // ================================
  // REVIEW
  // ================================
  const openQuizReview = async (quizSession) => {
    navigate(
      `/review-quiz?mode=quiz&sessionId=${encodeURIComponent(
        quizSession.id,
      )}&topicName=${encodeURIComponent(quizSession.name)}`,
    );
  };

  // ================================
  // SUBMIT QUIZ
  // ================================
  const handleQuizSubmit = async () => {
    if (!session || isSubmitting) {
      return;
    }

    const unanswered = questions.find((item) => !answers[item.id]);

    if (unanswered) {
      const unansweredIndex = questions.indexOf(unanswered);

      handleQuizNavigation(unansweredIndex);

      setError(`Soal nomor ${unansweredIndex + 1} belum dijawab.`);

      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await API.post(`/quiz/${session.id}/submit`, {
        answers: questions.map((item) => ({
          question_id: item.id,

          selected_option: answers[item.id],
        })),

        duration: elapsedSeconds,
      });

      sessionStorage.removeItem(storageKey);

      setSession(null);

      await openQuizReview(session);
    } catch (requestError) {
      try {
        const resultResponse = await API.get(`/quiz/${session.id}/result`);

        const savedResult = resultResponse.data.data;

        if (savedResult.completed_at) {
          sessionStorage.removeItem(storageKey);

          setSession(null);

          await openQuizReview(session);

          return;
        }
      } catch {
        // Keep local answers
      }

      setError(
        requestError.response?.data?.message ||
          "Jawaban kuis gagal dikirim. Jawaban Anda tetap tersimpan di halaman ini.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================
  // NUMBER NAVIGATION
  // ================================
  const handleNumberNavigation = (index) => {
    if (session?.mode === "pretest") {
      const sequence = index + 1;

      if (sequence > session.sequence) {
        return;
      }

      if (
        sequence < session.sequence &&
        !history.some((item) => item.sequence === sequence)
      ) {
        return;
      }

      setViewedSequence(sequence);

      return;
    }

    handleQuizNavigation(index);
  };

  // ================================
  // BACK
  // ================================
  const handleBack = () => navigate("/topik");

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar activePage="Topik" />

        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm font-semibold text-slate-600">
            Memuat sesi soal...
          </p>
        </main>
      </div>
    );
  }

  // ================================
  // RESULT
  // ================================
  if (result) {
    const correctCount = result.correct_answers ?? result.correct_count ?? 0;

    const totalCount = result.total_questions ?? 0;

    const score =
      mode === "pretest"
        ? (result.score ?? 0)
        : totalCount
          ? Math.round((correctCount / totalCount) * 100)
          : 0;

    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar activePage="Topik" />

        <main className="flex flex-1 items-center justify-center p-5 pb-24 md:pb-5">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase text-primary">
              {mode === "pretest" ? "Pretest selesai" : "Kuis selesai"}
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              {chapterName && mode === "pretest" ? chapterName : topicName}
            </h1>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Skor</p>

                <p className="mt-1 text-xl font-extrabold text-primary">
                  {score}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Benar</p>

                <p className="mt-1 text-xl font-extrabold text-emerald-700">
                  {correctCount}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Jumlah soal</p>

                <p className="mt-1 text-xl font-extrabold text-slate-800">
                  {totalCount}
                </p>
              </div>
            </div>

            {result.recommendation && (
              <p className="mt-5 whitespace-pre-line rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-slate-700">
                {result.recommendation}
              </p>
            )}

            <button
              type="button"
              onClick={handleBack}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover"
            >
              <ArrowLeft size={16} />
              Kembali ke topik
            </button>
          </section>
        </main>
      </div>
    );
  }

  // ================================
  // ERROR
  // ================================
  if (error && !session) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar activePage="Topik" />

        <main className="flex flex-1 items-center justify-center p-5 pb-24 md:pb-5">
          <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6">
            <h1 className="text-lg font-bold text-slate-900">
              Sesi soal tidak dapat dimuat
            </h1>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setRetryVersion((value) => value + 1)}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Coba lagi
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                Kembali ke topik
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!session || !question) {
    return null;
  }

  // ================================
  // QUESTION STATE
  // ================================
  const isPretest = session.mode === "pretest";

  const answeredCount = isPretest
    ? history.length
    : Object.keys(answers).length;

  const questionCount = isPretest ? session.totalQuestions : questions.length;

  const currentQuestionIndex = isPretest ? displaySequence - 1 : currentIndex;

  const selectedForQuestion = currentAnswer;

  const hasImage = question.images.length > 0;

  const isLastQuestion = isPretest
    ? session.sequence === session.totalQuestions &&
      !isHistoricalPretestQuestion
    : currentIndex === questions.length - 1;

  // ================================
  // RELATIVE NAVIGATION
  // ================================
  const navigateRelative = (direction) => {
    if (isPretest) {
      if (isHistoricalPretestQuestion) {
        const nextSequence = Math.min(
          session.sequence,
          Math.max(1, displaySequence + direction),
        );

        setViewedSequence(
          nextSequence === session.sequence ? null : nextSequence,
        );
      } else if (direction < 0 && session.sequence > 1) {
        const previousSequence = session.sequence - 1;

        if (history.some((item) => item.sequence === previousSequence)) {
          setViewedSequence(previousSequence);
        }
      }

      return;
    }

    handleQuizNavigation(
      Math.min(Math.max(currentIndex + direction, 0), questions.length - 1),
    );
  };

  // ================================
  // CONTINUE
  // ================================
  const handleContinue = () => {
    setError("");

    if (isPretest) {
      if (isHistoricalPretestQuestion) {
        setViewedSequence(null);
      } else if (session.lastQuestionSubmitted) {
        retryPretestSubmit();
      } else {
        handlePretestAnswer();
      }
    } else if (isLastQuestion) {
      handleQuizSubmit();
    } else {
      navigateRelative(1);
    }
  };

  // ================================
  // RENDER OPTIONS
  // ================================
  const renderOptions = () =>
    question.options.map((option) => {
      const isSelected = selectedForQuestion === option.id;

      return (
        <button
          key={option.id}
          type="button"
          disabled={isHistoricalPretestQuestion || isSubmitting}
          onClick={() =>
            isPretest
              ? handlePretestOptionSelect(option.id)
              : handleQuizAnswer(option.id)
          }
          className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all duration-200 disabled:cursor-not-allowed sm:gap-4 sm:p-3.5 ${
            isSelected
              ? "bg-primary text-white"
              : "border border-slate-100 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-9 sm:w-9 sm:text-sm ${
              isSelected
                ? "bg-white text-primary"
                : "bg-primary/10 text-primary"
            }`}
          >
            {option.id}
          </div>

          {/* ==========================================
                OPTION TEXT + LATEX
                ========================================== */}
          <span className="flex-1 text-xs font-semibold sm:text-sm">
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={inlineMarkdownComponents}
            >
              {normalizeMarkdown(option.text)}
            </ReactMarkdown>
          </span>
        </button>
      );
    });

  // ================================
  // RENDER NAVIGATION
  // ================================
  const renderNavigation = () => (
    <>
      {isHistoricalPretestQuestion && (
        <p className="text-xs text-slate-500">
          Jawaban sudah dikirim dan tidak dapat diubah.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-slate-100 pt-3 md:justify-end sm:gap-3">
        <button
          type="button"
          onClick={() => navigateRelative(-1)}
          disabled={
            isPretest
              ? isHistoricalPretestQuestion
                ? displaySequence <= 1
                : session.sequence <= 1
              : currentIndex === 0
          }
          className="flex items-center justify-center rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          Sebelumnya
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={
            isSubmitting ||
            (isPretest &&
              !isHistoricalPretestQuestion &&
              !session.lastQuestionSubmitted &&
              !selectedAnswer)
          }
          className="flex items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-sm"
        >
          {isSubmitting
            ? "Mengirim..."
            : isHistoricalPretestQuestion
              ? "Kembali ke soal aktif"
              : isLastQuestion
                ? "Submit"
                : "Selanjutnya"}
        </button>
      </div>
    </>
  );

  // ================================
  // MAIN UI
  // ================================
  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-neutral-bg font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col overflow-y-auto p-3 pb-20 md:overflow-hidden md:p-6 md:pb-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 sm:gap-4">
          {/* ==========================================
              QUESTION NUMBER NAVIGATION
              ========================================== */}
          <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-3">
            <div
              aria-label="Navigasi nomor soal"
              className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-1 py-0.5 sm:gap-2"
            >
              {Array.from(
                {
                  length: questionCount,
                },
                (_, index) => {
                  const sequence = index + 1;

                  const isCurrent = sequence === currentQuestionIndex + 1;

                  const hasAnswered = isPretest
                    ? history.some((item) => item.sequence === sequence)
                    : Boolean(answers[questions[index]?.id]);

                  const canNavigate =
                    !isPretest ||
                    sequence === session.sequence ||
                    history.some((item) => item.sequence === sequence);

                  return (
                    <button
                      key={sequence}
                      type="button"
                      aria-label={`Soal ${sequence}${
                        !canNavigate ? ", terkunci" : ""
                      }`}
                      aria-current={isCurrent ? "step" : undefined}
                      disabled={!canNavigate}
                      onClick={() => handleNumberNavigation(index)}
                      className={`relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-semibold transition-all sm:h-8 sm:w-8 ${
                        isCurrent
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {sequence}

                      {!canNavigate && (
                        <LockKeyhole
                          aria-hidden="true"
                          className="absolute -right-0.5 -top-0.5 rounded-full bg-white p-0.5"
                          size={13}
                        />
                      )}

                      {hasAnswered && !isCurrent && (
                        <Check
                          aria-hidden="true"
                          className="absolute -right-0.5 -top-0.5 rounded-full bg-white text-primary"
                          size={13}
                        />
                      )}
                    </button>
                  );
                },
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end rounded-xl border border-primary/20 bg-primary/10 px-3 py-1 sm:py-1.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-primary sm:text-[9px]">
                WAKTU PENGERJAAN
              </span>

              <span className="font-mono text-xs font-extrabold leading-none text-primary sm:text-sm sm:leading-normal">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* ==========================================
              QUESTION CONTENT
              ========================================== */}
          <div className="no-scrollbar flex-1 overflow-y-auto">
            {hasImage ? (
              <div className="grid h-full grid-cols-1 items-stretch gap-3 sm:gap-6 md:grid-cols-2">
                {/* ======================================
                    QUESTION + IMAGE
                    ====================================== */}
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <div className="shrink-0 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
                    <div className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-800 sm:text-sm md:text-base">
                      {/* ==================================
                          QUESTION TEXT + LATEX
                          ================================== */}
                      <ReactMarkdown
                        remarkPlugins={remarkPlugins}
                        rehypePlugins={rehypePlugins}
                        components={markdownComponents}
                      >
                        {normalizeMarkdown(question.text)}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* ====================================
                      IMAGE
                      ==================================== */}
                  <div className="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
                    <div className="flex max-h-full flex-wrap items-center justify-center gap-3">
                      {question.images.map((imageUrl) => (
                        <QuestionImage
                          key={imageUrl}
                          src={imageUrl}
                          alt="Ilustrasi Soal"
                          className="max-h-36 max-w-full rounded-xl object-contain sm:max-h-52 md:max-h-60"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ======================================
                    OPTIONS
                    ====================================== */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-6">
                  <div className="flex flex-1 flex-col justify-center space-y-2.5 sm:space-y-3">
                    {renderOptions()}
                  </div>

                  {renderNavigation()}
                </div>
              </div>
            ) : (
              <div className="flex h-auto flex-col gap-3 sm:gap-4">
                {/* ====================================
                    QUESTION WITHOUT IMAGE
                    ==================================== */}
                <div className="shrink-0 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
                  <div className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-800 sm:text-sm md:text-base">
                    {/* ==================================
                        QUESTION TEXT + LATEX
                        ================================== */}
                    <ReactMarkdown
                      remarkPlugins={remarkPlugins}
                      rehypePlugins={rehypePlugins}
                      components={markdownComponents}
                    >
                      {normalizeMarkdown(question.text)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* ====================================
                    OPTIONS
                    ==================================== */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-5">
                  <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-2">
                    {renderOptions()}
                  </div>

                  {renderNavigation()}
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
