import { useEffect, useRef, useState } from 'react'

const questions = [
  {
    level: 'Pemula',
    topic: 'Pecahan',
    question: 'Hitunglah hasil dari ½ + ¼',
    options: [
      { label: 'A', value: '¾' },
      { label: 'B', value: '⅙' },
      { label: 'C', value: '⅔' },
      { label: 'D', value: '½' },
    ],
    hint: 'Samakan penyebut kedua pecahan terlebih dahulu.',
  },
  {
    level: 'Pemula',
    topic: 'Aljabar Dasar',
    question: 'Berapakah nilai x jika x + 5 = 12?',
    options: [
      { label: 'A', value: '5' },
      { label: 'B', value: '6' },
      { label: 'C', value: '7' },
      { label: 'D', value: '8' },
    ],
    hint: 'Pindahkan angka 5 ke ruas kanan dengan operasi pengurangan.',
  },
  {
    level: 'Menengah',
    topic: 'Persentase',
    question: 'Berapakah 25% dari 80?',
    options: [
      { label: 'A', value: '15' },
      { label: 'B', value: '20' },
      { label: 'C', value: '25' },
      { label: 'D', value: '30' },
    ],
    hint: 'Ubah 25% menjadi pecahan atau desimal terlebih dahulu.',
  },
]

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

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function QuestionPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isTimed, setIsTimed] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const [showScratchpad, setShowScratchpad] = useState(false)
  const [scratchColor, setScratchColor] = useState('#2563eb')
  const [scratchpads, setScratchpads] = useState({})

  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)

  const question = questions[currentQuestion]

  const selectedAnswer = answers[currentQuestion] || null

  const progress =
    ((currentQuestion + 1) / questions.length) * 100

  // =========================
  // TIMER
  // =========================
  useEffect(() => {
    if (!isTimed) return

    const timer = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimed])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`
  }

  // =========================
  // CANVAS
  // =========================
  useEffect(() => {
    if (!showScratchpad || !canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1

    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio

    context.scale(ratio, ratio)

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, rect.width, rect.height)

    const savedDrawing = scratchpads[currentQuestion]

    if (savedDrawing) {
      const image = new Image()

      image.onload = () => {
        context.drawImage(
          image,
          0,
          0,
          rect.width,
          rect.height
        )
      }

      image.src = savedDrawing
    }
  }, [showScratchpad, currentQuestion])

  const getCanvasPosition = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startDrawing = (event) => {
    if (!canvasRef.current) return

    isDrawingRef.current = true
    canvasRef.current.setPointerCapture(event.pointerId)

    const { x, y } = getCanvasPosition(event)
    const context = canvasRef.current.getContext('2d')

    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (event) => {
    if (!isDrawingRef.current || !canvasRef.current) return

    const { x, y } = getCanvasPosition(event)
    const context = canvasRef.current.getContext('2d')

    context.lineWidth = 3
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = scratchColor

    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawingRef.current || !canvasRef.current) return

    isDrawingRef.current = false

    const canvas = canvasRef.current

    setScratchpads((previous) => ({
      ...previous,
      [currentQuestion]: canvas.toDataURL('image/png'),
    }))
  }

  const clearScratchpad = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()

    context.clearRect(0, 0, rect.width, rect.height)

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, rect.width, rect.height)

    setScratchpads((previous) => {
      const updated = { ...previous }
      delete updated[currentQuestion]
      return updated
    })
  }

  // =========================
  // ANSWER
  // =========================
  const handleSelectAnswer = (label) => {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: label,
    }))
  }

  // =========================
  // NAVIGATION
  // =========================
  const handleNext = () => {
    if (!selectedAnswer) return

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1)
      setShowHint(false)
      setShowScratchpad(false)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1)
      setShowHint(false)
      setShowScratchpad(false)
    }
  }

  const handleSkip = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1)
      setShowHint(false)
      setShowScratchpad(false)
    }
  }

  const handleShowHint = () => {
    setShowHint(true)
  }

  const handleFinish = () => {
    alert('Pengerjaan soal selesai!')
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] p-1">
      <div className="min-h-[calc(100vh-8px)] bg-[#f8faff]">
        <main className="min-h-screen">
          <div className="mx-auto w-full max-w-[860px] px-4 py-6 sm:px-6 sm:py-8">

            {/* =========================
                BADGE + STREAK + TARGET
            ========================= */}
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                  🎓 SD
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                  🔥 0 day streak
                </span>
              </div>

              <div className="w-36">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <TargetIcon />
                    Target harian
                  </span>

                  <span>3/10</span>
                </div>

                <div className="h-1.5 rounded-full bg-blue-100">
                  <div className="h-full w-[30%] rounded-full bg-blue-500" />
                </div>
              </div>
            </div>

            {/* =========================
                KELUAR + TIMER
            ========================= */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Keluar
              </button>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() => setIsTimed((previous) => !previous)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isTimed
                      ? 'bg-blue-600 text-white'
                      : 'border border-blue-200 bg-white text-blue-600'
                  }`}
                >
                  <StopwatchIcon />

                  {isTimed
                    ? 'Dengan Waktu'
                    : 'Tanpa Waktu'}
                </button>

                <span className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                  <ClockIcon />
                  {formatTime(elapsedSeconds)}
                </span>

              </div>
            </div>

            {/* =========================
                PROGRESS
            ========================= */}
            <div className="mb-4">

              <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                <span>
                  Soal {currentQuestion + 1} dari {questions.length}
                </span>

                <span>
                  {Math.round(progress)}% selesai
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
                KARTU SOAL
            ========================= */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex items-center justify-between gap-3">

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600">
                  {question.level}
                </span>

                <span className="text-right text-[11px] text-slate-500">
                  {question.topic}
                </span>

              </div>

              <h2 className="mt-5 text-lg font-medium text-[#17326b]">
                {question.question}
              </h2>

              {/* =========================
                  PETUNJUK
              ========================= */}
              {showHint && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  <LightbulbIcon />
                  {question.hint}
                </div>
              )}

              {/* =========================
                  PILIHAN JAWABAN
              ========================= */}
              <div className="mt-4 space-y-2.5">

                {question.options.map((option) => {
                  const isSelected =
                    selectedAnswer === option.label

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        handleSelectAnswer(option.label)
                      }
                      className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-blue-100 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium ${
                          isSelected
                            ? 'border-blue-500 text-blue-600'
                            : 'border-blue-200 text-blue-600'
                        }`}
                      >
                        {option.label}
                      </span>

                      <span className="text-sm text-slate-700">
                        {option.value}
                      </span>
                    </button>
                  )
                })}

              </div>

              {/* =========================
                  AKSI
              ========================= */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  {/* PETUNJUK */}
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
                    Petunjuk
                  </button>

                  {/* LEWATI */}
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={
                      currentQuestion === questions.length - 1
                    }
                    className="text-xs font-medium text-slate-700 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Lewati
                  </button>

                </div>

                <div className="flex items-center gap-2">

                  {/* KEMBALI */}
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentQuestion === 0}
                    className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  >
                    ← Kembali
                  </button>

                  {/* LANJUT */}
                  {currentQuestion < questions.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!selectedAnswer}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
                    >
                      Lanjut →
                    </button>
                  )}

                  {/* SELESAI */}
                  {currentQuestion === questions.length - 1 && (
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      Selesai
                    </button>
                  )}

                </div>

              </div>

            </section>

            {/* =========================
                CORETAN
            ========================= */}
            <button
              type="button"
              onClick={() =>
                setShowScratchpad((previous) => !previous)
              }
              className="mt-5 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
            >
              ✎ Coretan{' '}
              {showScratchpad
                ? '− sembunyikan'
                : '+ tampilkan'}
            </button>

            {showScratchpad && (
              <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">

                {/* TOOLBAR */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">

                  <span className="text-xs font-medium text-slate-600">
                    Papan coretan
                  </span>

                  <div className="flex items-center gap-2">

                    {/* BIRU */}
                    <button
                      type="button"
                      onClick={() =>
                        setScratchColor('#2563eb')
                      }
                      aria-label="Warna biru"
                      className={`h-7 w-7 rounded-full border-2 bg-blue-600 ${
                        scratchColor === '#2563eb'
                          ? 'border-blue-900 ring-2 ring-blue-200'
                          : 'border-white'
                      }`}
                    />

                    {/* BIRU MUDA */}
                    <button
                      type="button"
                      onClick={() =>
                        setScratchColor('#0ea5e9')
                      }
                      aria-label="Warna biru muda"
                      className={`h-7 w-7 rounded-full border-2 bg-sky-500 ${
                        scratchColor === '#0ea5e9'
                          ? 'border-sky-900 ring-2 ring-sky-200'
                          : 'border-white'
                      }`}
                    />

                    {/* HITAM */}
                    <button
                      type="button"
                      onClick={() =>
                        setScratchColor('#111827')
                      }
                      aria-label="Warna hitam"
                      className={`h-7 w-7 rounded-full border-2 bg-slate-900 ${
                        scratchColor === '#111827'
                          ? 'border-slate-700 ring-2 ring-slate-200'
                          : 'border-white'
                      }`}
                    />

                    {/* MERAH */}
                    <button
                      type="button"
                      onClick={() =>
                        setScratchColor('#dc2626')
                      }
                      aria-label="Warna merah"
                      className={`h-7 w-7 rounded-full border-2 bg-red-600 ${
                        scratchColor === '#dc2626'
                          ? 'border-red-900 ring-2 ring-red-200'
                          : 'border-white'
                      }`}
                    />

                    {/* HAPUS */}
                    <button
                      type="button"
                      onClick={clearScratchpad}
                      aria-label="Hapus coretan"
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-red-500"
                    >
                      <TrashIcon />
                    </button>

                  </div>
                </div>

                {/* CANVAS */}
                <div className="p-3">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                    className="block h-[220px] w-full touch-none cursor-crosshair rounded-lg border border-blue-100 bg-white"
                  />
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}

export default QuestionPage