import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookMarked, CheckCircle2, GraduationCap, School, TimerReset } from "lucide-react";
import MathText from "../components/MathText";
import { mathQuestions } from "../data/mathSeeds";
import { recordStudentResponse } from "../services/api";

export default function StudentJourney({ onSwitchSurface }) {
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState({ band: "", grade: "", topic: "", subtopic: "" });
  const [quizIndex, setQuizIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [answerChanges, setAnswerChanges] = useState(0);

  const bands = ["SD", "SMP", "SMA"];
  const grades = selection.band === "SD" ? [4, 5, 6] : selection.band === "SMP" ? [7, 8, 9] : [10, 11, 12];
  const available = useMemo(() => mathQuestions.filter((question) =>
    (!selection.band || question.gradeBand === selection.band)
    && (!selection.grade || question.grade === Number(selection.grade))), [selection.band, selection.grade]);
  const topics = [...new Set(available.map((question) => question.topic))];
  const subtopics = [...new Set(available.filter((question) => !selection.topic || question.topic === selection.topic).map((question) => question.subtopic))];
  const quiz = available.filter((question) => (!selection.topic || question.topic === selection.topic) && (!selection.subtopic || question.subtopic === selection.subtopic));
  const current = quiz[quizIndex % Math.max(quiz.length, 1)] ?? mathQuestions[0];
  const selectStageValue = (key, value) => {
    const order = ["band", "grade", "topic", "subtopic"];
    const changedIndex = order.indexOf(key);
    setSelection((currentSelection) => Object.fromEntries(order.map((field, index) =>
      [field, index < changedIndex ? currentSelection[field] : index === changedIndex ? value : ""]
    )));
  };

  const stages = [
    { key: "band", title: "Pilih jenjang", subtitle: "Kami menyesuaikan materi dengan tahap belajarmu.", values: bands },
    { key: "grade", title: "Pilih kelas", subtitle: "Soal akan difilter berdasarkan kelas sasaran.", values: grades },
    { key: "topic", title: "Pilih bab", subtitle: "Mulai dari bab yang ingin kamu kuasai.", values: topics },
    { key: "subtopic", title: "Pilih subbab", subtitle: "Fokuskan latihan agar hasil diagnostik lebih bermakna.", values: subtopics },
  ];

  if (step < stages.length) {
    const stage = stages[step];
    return <div className="student-shell">
      <header className="student-header"><div className="student-brand"><span>N</span><strong>Nalar</strong></div><button onClick={onSwitchSurface}><School size={17} /> Masuk sebagai guru</button></header>
      <main className="student-selector">
        <div className="student-progress">{stages.map((_, index) => <span key={index} className={index <= step ? "active" : ""} />)}</div>
        <p className="eyebrow">LANGKAH {step + 1} DARI 4</p><h1>{stage.title}</h1><p>{stage.subtitle}</p>
        <div className="choice-grid">{stage.values.map((value) => <button key={value} className={String(selection[stage.key]) === String(value) ? "selected" : ""} onClick={() => selectStageValue(stage.key, value)}><GraduationCap size={21} /><strong>{stage.key === "grade" ? `Kelas ${value}` : value}</strong></button>)}</div>
        <div className="selector-actions"><button disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> Kembali</button><button className="primary-button" disabled={!selection[stage.key]} onClick={() => setStep(step + 1)}>{step === 3 ? "Mulai latihan" : "Lanjut"}<ArrowRight size={17} /></button></div>
      </main>
    </div>;
  }

  return <div className="quiz-shell">
    <header className="quiz-header"><button onClick={() => setStep(3)}><ArrowLeft size={17} /> Ganti topik</button><div><strong>{selection.topic}</strong><span>{selection.band} · Kelas {selection.grade} · {selection.subtopic}</span></div><span><TimerReset size={17} /> waktu direkam</span></header>
    <main className="quiz-main">
      <div className="quiz-meta"><span>{current.bloom} · {current.knowledgeLabel}</span><span>{quizIndex + 1} / {Math.max(quiz.length, 1)}</span></div>
      <h1><MathText>{current.questionText}</MathText></h1>
      {current.type === "multiple_choice" ? <div className="quiz-options">{current.options.map((option, optionIndex) => <button className={answer === option ? "selected" : ""} key={`${option}-${optionIndex}`} onClick={() => { if (answer && answer !== option) setAnswerChanges((count) => count + 1); setAnswer(option); }}><span>{String.fromCharCode(65 + optionIndex)}</span><MathText>{option}</MathText></button>)}</div> : <textarea className="student-answer" placeholder="Tuliskan jawaban dan langkah berpikirmu…" value={answer} onChange={(event) => setAnswer(event.target.value)} />}
      <div className="quiz-footer"><div><BookMarked size={18} /><span>Jawaban, waktu, dan perubahan pilihan digunakan untuk analisis butir secara agregat.</span></div><button className="primary-button" disabled={!answer} onClick={async () => {
        const payload = { questionId: current.id, studentHash: "demo-student-hash", assessmentId: "demo-math-session", selectedAnswer: answer, isCorrect: answer === current.correctAnswer, responseTimeMs: Date.now() - startedAt, answerChanges };
        try { await recordStudentResponse(payload); } catch { /* UI remains usable without local backend. */ }
        setQuizIndex((index) => index + 1); setAnswer(""); setAnswerChanges(0); setStartedAt(Date.now());
      }}><CheckCircle2 size={18} /> Simpan & lanjut</button></div>
    </main>
  </div>;
}
