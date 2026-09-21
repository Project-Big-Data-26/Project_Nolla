import React, { useState } from "react";
import Navbar from "../components/Navbar";
import {
  TargetIcon,
  StopwatchIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  LightbulbIcon,
} from "../components/QuizIcons";

const questions = [
  {
    level: "Beginner",
    topic: "Fractions & Percent",
    question: "Compute ½ + ¼",
    options: [
      { label: "A", value: "¾" },
      { label: "B", value: "⅙" },
      { label: "C", value: "⅔" },
      { label: "D", value: "½" },
    ],
    answer: "A",
    hint: "Find a common denominator.",
    solution: "Common denominator 4: ½ = 2/4, so 2/4 + 1/4 = 3/4.",
  },
  {
    level: "Beginner",
    topic: "Basic Algebra",
    question: "What is the value of x if x + 5 = 12?",
    options: [
      { label: "A", value: "5" },
      { label: "B", value: "6" },
      { label: "C", value: "7" },
      { label: "D", value: "8" },
    ],
    answer: "C",
    hint: "Move 5 to the other side of the equation.",
    solution:
      "Subtract 5 from both sides: x + 5 - 5 = 12 - 5. Therefore, x = 7.",
  },
  {
    level: "Intermediate",
    topic: "Percent",
    question: "What is 25% of 80?",
    options: [
      { label: "A", value: "15" },
      { label: "B", value: "20" },
      { label: "C", value: "25" },
      { label: "D", value: "30" },
    ],
    answer: "B",
    hint: "Convert 25% into a fraction or decimal.",
    solution:
      "25% = 25/100 = 0.25. Then 0.25 × 80 = 20. Therefore, the answer is 20.",
  },
];

/* =========================
   QUESTION PAGE COMPONENT
========================= */

const QuestionPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [isTimed, setIsTimed] = useState(true);
  const [showHint, setShowHint] = useState(false);

  const question = questions[currentQuestion];
  const progress = (currentQuestion / questions.length) * 100;
  const isCorrect = selectedAnswer === question.answer;

  const handleSelectAnswer = (label) => {
    if (!checked) {
      setSelectedAnswer(label);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer) {
      setChecked(true);
    }
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setChecked(false);
    setShowHint(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      resetQuestionState();
    }
  };

  const handleSkip = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      resetQuestionState();
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg font-sans">
      {/* Sidebar / Navbar di Sisi Kiri */}
      <Navbar />

      {/* Area Konten Utama Soal */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto w-full max-w-[860px]">
          {/* TOP INFORMATION */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                🎓 SD
              </span>
              <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary-hover">
                🔥 1 day streak 🔥
              </span>
            </div>

            {/* DAILY GOAL */}
            <div className="w-36">
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <TargetIcon />
                  Daily goal
                </span>
                <span className="font-medium text-neutral-text">3/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-border overflow-hidden">
                <div className="h-full w-[30%] rounded-full bg-primary" />
              </div>
            </div>
          </div>

          {/* EXIT + TIMER */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              ← Exit
            </button>

            <div className="flex items-center gap-2">
              {/* TIMED / UNTIMED */}
              <button
                type="button"
                onClick={() => setIsTimed(!isTimed)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${isTimed
                    ? "bg-primary text-white shadow-sm"
                    : "border border-neutral-border bg-neutral-card text-primary hover:bg-neutral-bg"
                  }`}
              >
                <StopwatchIcon />
                {isTimed ? "Timed" : "Untimed"}
              </button>

              {/* TIMER */}
              <span className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <ClockIcon />
                {isTimed ? "2:35" : "4:07"}
              </span>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="mb-6">
            <div className="mb-1.5 flex justify-between text-xs text-neutral-muted">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* QUESTION CARD (bukan SectionCard: shadow-sm & p-6 beda dari default shadow-xs-nya SectionCard) */}
          <section className="rounded-2xl border border-neutral-border bg-neutral-card p-6 shadow-sm">
            {/* QUESTION HEADER */}
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {question.level}
              </span>
              <span className="text-right text-xs text-neutral-muted font-medium">
                {question.topic}
              </span>
            </div>

            {/* QUESTION */}
            <h2 className="mt-5 font-heading text-lg font-semibold text-neutral-text">
              {question.question}
            </h2>

            {/* HINT */}
            {showHint && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-xs font-medium text-secondary-hover">
                <LightbulbIcon />
                {question.hint}
              </div>
            )}

            {/* ANSWER OPTIONS */}
            <div className="mt-5 space-y-3">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option.label;
                const isCorrectAnswer =
                  checked && option.label === question.answer;
                const isWrongAnswer =
                  checked && isSelected && option.label !== question.answer;

                let optionStyle =
                  "border-neutral-border bg-neutral-card hover:border-primary/40 text-neutral-text";

                if (isSelected && !checked) {
                  optionStyle =
                    "border-primary bg-primary/5 text-primary font-medium";
                }
                if (isCorrectAnswer) {
                  optionStyle =
                    "border-success bg-success/10 text-success font-medium";
                }
                if (isWrongAnswer) {
                  optionStyle =
                    "border-danger bg-danger/10 text-danger font-medium";
                }

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelectAnswer(option.label)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-all cursor-pointer ${optionStyle}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${isCorrectAnswer
                          ? "border-success text-success"
                          : isWrongAnswer
                            ? "border-danger text-danger"
                            : isSelected && !checked
                              ? "border-primary text-primary"
                              : "border-neutral-border text-neutral-muted"
                        }`}
                    >
                      {option.label}
                    </span>

                    <span className="text-sm font-medium">{option.value}</span>

                    {isCorrectAnswer && (
                      <span className="ml-auto text-success">
                        <CheckIcon />
                      </span>
                    )}

                    {isWrongAnswer && (
                      <span className="ml-auto text-danger">
                        <XIcon />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* RESULT FEEDBACK */}
            {checked && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium ${isCorrect
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                  }`}
              >
                {isCorrect ? (
                  <>
                    <CheckIcon />
                    <span>Great job! Your answer is correct.</span>
                  </>
                ) : (
                  <>
                    <XIcon />
                    <span>
                      Not quite. Correct answer:{" "}
                      {
                        question.options.find(
                          (option) => option.label === question.answer,
                        )?.value
                      }
                    </span>
                  </>
                )}
              </div>
            )}

            {/* STEP-BY-STEP SOLUTION */}
            {checked && (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-bold text-primary">
                  Step-by-step solution
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-text">
                  {question.solution}
                </p>
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* HINT BUTTON */}
                <button
                  type="button"
                  onClick={handleShowHint}
                  disabled={showHint}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all ${showHint
                      ? "cursor-not-allowed border-neutral-border bg-neutral-bg text-neutral-muted"
                      : "border-neutral-border bg-neutral-card text-neutral-text hover:bg-neutral-bg cursor-pointer"
                    }`}
                >
                  <LightbulbIcon />
                  Hint
                </button>

                {/* SKIP BUTTON */}
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={currentQuestion === questions.length - 1}
                  className="text-xs font-semibold text-neutral-muted hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-neutral-border"
                >
                  ▷ Skip
                </button>
              </div>

              {/* CHECK / NEXT BUTTON */}
              {!checked ? (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer}
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-border disabled:text-neutral-muted"
                >
                  Check answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover cursor-pointer"
                >
                  {currentQuestion === questions.length - 1
                    ? "Finish"
                    : "Next question"}
                  <span className="text-sm leading-none">›</span>
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default QuestionPage;