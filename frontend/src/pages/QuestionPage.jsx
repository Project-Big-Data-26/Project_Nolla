import { useState } from 'react'

const questions = [
  {
    level: 'Beginner',
    topic: 'Fractions & Percent',
    question: 'Compute ½ + ¼',
    options: [
      { label: 'A', value: '¾' },
      { label: 'B', value: '⅙' },
      { label: 'C', value: '⅔' },
      { label: 'D', value: '½' },
    ],
    answer: 'A',
    hint: 'Find a common denominator.',
    solution: 'Common denominator 4: ½ = 2/4, so 2/4 + 1/4 = 3/4.',
  },
  {
    level: 'Beginner',
    topic: 'Basic Algebra',
    question: 'What is the value of x if x + 5 = 12?',
    options: [
      { label: 'A', value: '5' },
      { label: 'B', value: '6' },
      { label: 'C', value: '7' },
      { label: 'D', value: '8' },
    ],
    answer: 'C',
    hint: 'Move 5 to the other side of the equation.',
    solution:
      'Subtract 5 from both sides: x + 5 - 5 = 12 - 5. Therefore, x = 7.',
  },
  {
    level: 'Intermediate',
    topic: 'Percent',
    question: 'What is 25% of 80?',
    options: [
      { label: 'A', value: '15' },
      { label: 'B', value: '20' },
      { label: 'C', value: '25' },
      { label: 'D', value: '30' },
    ],
    answer: 'B',
    hint: 'Convert 25% into a fraction or decimal.',
    solution:
      '25% = 25/100 = 0.25. Then 0.25 × 80 = 20. Therefore, the answer is 20.',
  },
]

/* =========================
   ICONS
========================= */

function TargetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function StopwatchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M9 2h6" />
      <path d="M12 2v3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

function LightbulbIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.6-1.5 2.5h-4c0-.9-.6-1.8-1.5-2.5Z" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M4 5.5v16" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V22h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 17a1.7 1.7 0 0 0-1.5-1H6v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 8.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V7h2.6v.5a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V16h-.1a1.7 1.7 0 0 0-1.1-1Z" />
    </svg>
  )
}

/* =========================
   QUESTION PAGE
========================= */

function QuestionPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [checked, setChecked] = useState(false)
  const [isTimed, setIsTimed] = useState(true)
  const [showHint, setShowHint] = useState(false)

  const question = questions[currentQuestion]

  const progress = (currentQuestion / questions.length) * 100

  const isCorrect = selectedAnswer === question.answer

  const handleSelectAnswer = (label) => {
    if (!checked) {
      setSelectedAnswer(label)
    }
  }

  const handleCheckAnswer = () => {
    if (selectedAnswer) {
      setChecked(true)
    }
  }

  const handleShowHint = () => {
    setShowHint(true)
  }

  const resetQuestionState = () => {
    setSelectedAnswer(null)
    setChecked(false)
    setShowHint(false)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      resetQuestionState()
    }
  }

  const handleSkip = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      resetQuestionState()
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] p-1">

      {/* =========================
          APP FRAME
      ========================= */}
      <div className="flex h-[calc(100vh-8px)] flex-col overflow-hidden border border-slate-200 bg-[#f8faff] md:h-auto md:min-h-[calc(100vh-8px)] md:flex-row">

        {/* =========================
            MOBILE HEADER
            STICKY
        ========================= */}
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between bg-[#192b5c] px-5 text-white shadow-sm md:hidden">

          <span className="text-base font-bold">
            MathMentor
          </span>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-2xl"
            aria-label="Open menu"
          >
            ☰
          </button>

        </header>

        {/* =========================
            DESKTOP SIDEBAR
        ========================= */}
        <aside className="hidden w-[220px] shrink-0 flex-col bg-[#192b5c] text-white md:flex">

          <div className="flex items-center gap-3 px-5 py-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
              Σ
            </div>

            <div>
              <h1 className="text-[15px] font-bold">
                Math Mentor
              </h1>

              <p className="text-[11px] text-blue-200">
                Learn. Practice. Master.
              </p>
            </div>

          </div>

          <nav className="mt-8 space-y-2 px-3">

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              <GridIcon />
              Dashboard
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              <BookIcon />
              Topics
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              <UserIcon />
              Profile
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              <SettingsIcon />
              Settings
            </button>

          </nav>

          <div className="mt-auto border-t border-white/10 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold">
                L
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Learner
                </p>

                <p className="text-[10px] text-blue-200">
                  learner@example.com
                </p>
              </div>

            </div>

            <button
              type="button"
              className="mt-6 flex items-center gap-2 text-sm text-white hover:text-blue-200"
            >
              ←
              Sign out
            </button>

          </div>

        </aside>

        {/* =========================
            MAIN CONTENT
        ========================= */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">

          <div className="mx-auto w-full max-w-[860px] px-4 py-6 sm:px-6 sm:py-8">

            {/* TOP INFORMATION */}
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                  🎓
                  SD
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                  🔥 1 day streak 🔥
                </span>

              </div>

              {/* DAILY GOAL */}
              <div className="w-36">

                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">

                  <span className="flex items-center gap-1.5">
                    <TargetIcon />
                    Daily goal
                  </span>

                  <span>
                    3/10
                  </span>

                </div>

                <div className="h-1.5 rounded-full bg-blue-100">

                  <div className="h-full w-[30%] rounded-full bg-blue-500" />

                </div>

              </div>

            </div>

            {/* EXIT + TIMER */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Exit
              </button>

              <div className="flex items-center gap-2">

                {/* TIMED / UNTIMED */}
                <button
                  type="button"
                  onClick={() => setIsTimed(!isTimed)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isTimed
                      ? 'bg-blue-600 text-white'
                      : 'border border-blue-200 bg-white text-blue-600'
                  }`}
                >

                  <StopwatchIcon />

                  {isTimed ? 'Timed' : 'Untimed'}

                </button>

                {/* TIMER */}
                <span className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">

                  <ClockIcon />

                  {isTimed ? '2:35' : '4:07'}

                </span>

              </div>

            </div>

            {/* PROGRESS */}
            <div className="mb-4">

              <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">

                <span>
                  Question {currentQuestion + 1} of {questions.length}
                </span>

                <span>
                  {Math.round(progress)}% complete
                </span>

              </div>

              <div className="h-1.5 rounded-full bg-blue-100">

                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />

              </div>

            </div>

            {/* =========================
                QUESTION CARD
            ========================= */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">

              {/* QUESTION HEADER */}
              <div className="flex items-center justify-between gap-3">

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600">
                  {question.level}
                </span>

                <span className="text-right text-[11px] text-slate-500">
                  {question.topic}
                </span>

              </div>

              {/* QUESTION */}
              <h2 className="mt-5 text-lg font-medium text-[#17326b]">
                {question.question}
              </h2>

              {/* =========================
                  HINT
                  HIDDEN UNTIL CLICKED
              ========================= */}
              {showHint && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">

                  <LightbulbIcon />

                  {question.hint}

                </div>
              )}

              {/* ANSWER OPTIONS */}
              <div className="mt-4 space-y-2.5">

                {question.options.map((option) => {

                  const isSelected =
                    selectedAnswer === option.label

                  const isCorrectAnswer =
                    checked &&
                    option.label === question.answer

                  const isWrongAnswer =
                    checked &&
                    isSelected &&
                    option.label !== question.answer

                  let optionStyle =
                    'border-blue-100 bg-white hover:border-blue-300'

                  if (isSelected && !checked) {
                    optionStyle =
                      'border-blue-500 bg-blue-50'
                  }

                  if (isCorrectAnswer) {
                    optionStyle =
                      'border-emerald-400 bg-emerald-50'
                  }

                  if (isWrongAnswer) {
                    optionStyle =
                      'border-red-400 bg-red-50'
                  }

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        handleSelectAnswer(option.label)
                      }
                      className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition ${optionStyle}`}
                    >

                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium ${
                          isCorrectAnswer
                            ? 'border-emerald-400 text-emerald-600'
                            : isWrongAnswer
                              ? 'border-red-400 text-red-600'
                              : 'border-blue-200 text-blue-600'
                        }`}
                      >
                        {option.label}
                      </span>

                      <span className="text-sm text-slate-700">
                        {option.value}
                      </span>

                      {isCorrectAnswer && (
                        <span className="ml-auto text-emerald-500">
                          <CheckIcon />
                        </span>
                      )}

                      {isWrongAnswer && (
                        <span className="ml-auto text-red-500">
                          <XIcon />
                        </span>
                      )}

                    </button>
                  )
                })}

              </div>

              {/* RESULT */}
              {checked && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >

                  {isCorrect ? (
                    <>
                      <CheckIcon />

                      <span>
                        Great job! Your answer is correct.
                      </span>
                    </>
                  ) : (
                    <>
                      <XIcon />

                      <span>
                        Not quite. Correct answer:{' '}
                        {
                          question.options.find(
                            (option) =>
                              option.label === question.answer
                          )?.value
                        }
                      </span>
                    </>
                  )}

                </div>
              )}

              {/* STEP-BY-STEP SOLUTION */}
              {checked && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <p className="text-[11px] font-semibold text-blue-600">
                    Step-by-step solution
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-slate-700">
                    {question.solution}
                  </p>

                </div>
              )}

              {/* ACTIONS */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

                <div className="flex items-center gap-5">

                  {/* HINT BUTTON */}
                  <button
                    type="button"
                    onClick={handleShowHint}
                    disabled={showHint}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs transition ${
                      showHint
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >

                    <LightbulbIcon />

                    Hint

                  </button>

                  {/* SKIP */}
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={
                      currentQuestion === questions.length - 1
                    }
                    className="text-xs font-medium text-slate-700 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    ▷ Skip
                  </button>

                </div>

                {/* CHECK / NEXT */}
                {!checked ? (

                  <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
                  >
                    Check answer
                  </button>

                ) : (

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >

                    {currentQuestion === questions.length - 1
                      ? 'Finish'
                      : 'Next question'}

                    <span className="text-base leading-none">
                      ›
                    </span>

                  </button>

                )}

              </div>

            </section>

            {/* SCRATCHPAD */}
            <button
              type="button"
              className="mt-5 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
            >
              ✎ Scratchpad + show
            </button>

          </div>

        </main>

      </div>

    </div>
  )
}

export default QuestionPage