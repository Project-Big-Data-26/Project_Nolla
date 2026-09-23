import { useMemo, useRef, useState } from "react";
import {
  BadgeCheck, BarChart3, BookOpen, Check, ChevronDown, ClipboardCheck,
  Database, FileImage, FileText, FlaskConical, GraduationCap, ImagePlus,
  LayoutDashboard, LibraryBig, ListChecks, LoaderCircle, PanelLeft, Plus,
  Save, Send, Settings, ShieldCheck, Sparkles, Trash2, UserRoundCheck,
} from "lucide-react";
import GeometryBoard from "../components/GeometryBoard";
import MathText from "../components/MathText";
import { bloomOptions, knowledgeOptions, mathQuestions, taxonomyCoverage } from "../data/mathSeeds";
import { classifyQuestion, extractSource, saveQuestion } from "../services/api";

const questionTypes = [
  ["multiple_choice", "Pilihan Ganda — satu jawaban"],
  ["multiple_response", "Pilihan Ganda Kompleks"],
  ["true_false", "Benar / Salah"],
  ["numeric", "Jawaban Numerik"],
  ["short_answer", "Jawaban Singkat"],
  ["essay", "Uraian / Esai"],
  ["matching", "Menjodohkan"],
];

const sidebarItems = [
  [LayoutDashboard, "Beranda"], [FileText, "Buat Soal", true],
  [LibraryBig, "Bank Soal"], [ClipboardCheck, "Review"],
  [BarChart3, "Psikometrik"], [Database, "Sumber Data"], [Settings, "Pengaturan"],
];

const evidence = [
  { source: "Dapodik", status: "Cocok", detail: "NUPTK dan satuan pendidikan terkonfirmasi" },
  { source: "PDDikti", status: "Cocok", detail: "S1 Pendidikan Matematika" },
  { source: "Sertifikasi Pendidik", status: "Valid", detail: "Bidang studi Matematika" },
];

function getModelSuggestion(form) {
  const text = form.questionText.toLowerCase();
  const bloom = text.includes("rancang") || text.includes("buat") ? "C6"
    : text.includes("evaluasi") || text.includes("nilai") ? "C5"
      : text.includes("analisis") || text.includes("bandingkan") ? "C4"
        : text.includes("hitung") || text.includes("tentukan") || text.includes("gunakan") ? "C3"
          : text.includes("jelaskan") ? "C2" : "C1";
  const difficulty = form.reasoningSteps >= 4 ? "Hard" : form.reasoningSteps >= 2 ? "Medium" : "Easy";
  return { bloom, knowledge: form.knowledgeDimension, difficulty, confidence: form.questionText.length > 40 ? 0.82 : 0.66 };
}

export default function TeacherStudio({ onSwitchSurface }) {
  const seed = mathQuestions.find((question) => question.id === "MTK-C3-3") ?? mathQuestions[0];
  const fileInput = useRef(null);
  const [activePanel, setActivePanel] = useState("author");
  const [upload, setUpload] = useState({ status: "idle", name: "" });
  const [notice, setNotice] = useState("");
  const [remoteSuggestion, setRemoteSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    questionType: "multiple_choice",
    questionText: "Jika $x^2 + 5x + 6 = 0$, tentukan akar-akarnya.",
    options: ["$x=-2$ dan $x=-3$", "$x=2$ dan $x=3$", "$x=-1$ dan $x=-6$", "$x=1$ dan $x=6$"],
    correctAnswer: 0, bloom: seed.bloom, knowledgeDimension: seed.knowledgeDimension,
    difficulty: seed.difficulty, gradeBand: "SMA", grade: 10,
    topic: "Aljabar", subtopic: "Persamaan Kuadrat",
    learningObjective: "Menerapkan pemfaktoran untuk menentukan akar persamaan kuadrat.",
    reasoningSteps: 3, sourceReference: "Buku Matematika SMA Kelas X, Bab Persamaan Kuadrat",
  });

  const localSuggestion = useMemo(() => getModelSuggestion(form), [form]);
  const suggestion = remoteSuggestion || localSuggestion;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setOption = (index, value) => {
    const options = [...form.options]; options[index] = value; update("options", options);
  };
  const handleUpload = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUpload({ status: "processing", name: file.name });
    try {
      const extracted = await extractSource(file);
      setUpload({ status: "ready", name: file.name });
      if (extracted.extracted_text) update("questionText", extracted.extracted_text);
      setNotice(`Ekstraksi ${extracted.status}. ${extracted.warnings?.[0] || "Teks hasil OCR siap direview."}`);
    } catch {
      setUpload({ status: "ready", name: file.name });
      setNotice("File siap sebagai sumber lokal. Backend OCR belum aktif, sehingga teks perlu diperiksa manual.");
    }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    const questionId = `MTK-USER-${Date.now()}`;
    const payload = {
      questionId, subject: "Matematika", grade: form.grade, topic: form.topic, subtopic: form.subtopic,
      questionType: form.questionType, questionText: form.questionText,
      options: form.questionType.includes("multiple") ? form.options : undefined,
      correctAnswer: form.questionType.includes("multiple") ? form.options[form.correctAnswer] : undefined,
      explanation: form.learningObjective, sourceReference: form.sourceReference,
      authorClaim: { bloomLevel: form.bloom, knowledgeDimension: form.knowledgeDimension, difficulty: form.difficulty, reasoningSteps: form.reasoningSteps, justification: form.learningObjective },
    };
    try {
      await saveQuestion(payload);
      const prediction = await classifyQuestion({ question_id: questionId, question_text: form.questionText, question_type: form.questionType, subject: "Matematika", grade: form.grade, topic: form.topic, subtopic: form.subtopic, options: form.options, learning_objective: form.learningObjective, reasoning_steps: form.reasoningSteps });
      setRemoteSuggestion({ bloom: prediction.bloom.label, knowledge: prediction.knowledge_dimension.label, difficulty: prediction.difficulty.label, confidence: Math.min(prediction.bloom.confidence || 0, prediction.knowledge_dimension.confidence || 0, prediction.difficulty.confidence || 0) });
      setNotice("Soal tersimpan sebagai versi 1, dianalisis, dan masuk antrean review independen.");
    } catch {
      setNotice("Prototipe menyimpan state lokal. Jalankan backend dan layanan AI untuk persistensi serta klasifikasi penuh.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navigasi guru">
        <div className="brand-mark">N</div>
        <nav>{sidebarItems.map(([Icon, label, selected]) => (
          <button key={label} className={selected ? "nav-item active" : "nav-item"} title={label}><Icon size={19} /><span>{label}</span></button>
        ))}</nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Buka navigasi"><PanelLeft size={20} /></button>
          <div className="product-name"><strong>Nalar</strong><span>Question Intelligence</span></div>
          <div className="topbar-actions">
            <button className="surface-switch" onClick={onSwitchSurface}><GraduationCap size={17} /> Mode siswa</button>
            <div className="teacher-identity"><div className="avatar">IR</div><div><strong>Ibu Ratna</strong><span>Guru Matematika</span></div></div>
            <button className="verified-pill"><BadgeCheck size={16} /> Terverifikasi</button>
          </div>
        </header>

        <main className="teacher-page">
          <section className="page-heading">
            <div><p className="eyebrow">STUDIO PENULISAN SOAL</p><h1>Buat soal yang terukur</h1><p>Tulis, pratinjau, dan lengkapi bukti pedagogis sebelum direview.</p></div>
            <div className="heading-actions"><button className="secondary-button"><Save size={17} /> Simpan draf</button><button className="primary-button" onClick={submitForReview} disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Kirim untuk review</button></div>
          </section>

          {notice && <div className="notice" role="status"><Check size={17} /> {notice}</div>}
          <div className="teacher-grid">
            <section className="author-column">
              <div className="section-tabs" role="tablist"><button className={activePanel === "author" ? "active" : ""} onClick={() => setActivePanel("author")}>Editor soal</button><button className={activePanel === "coverage" ? "active" : ""} onClick={() => setActivePanel("coverage")}>Cakupan seeder</button></div>
              {activePanel === "coverage" ? <CoveragePanel /> : <>
                <div className="field-row two">
                  <label>Tipe soal<span className="select-wrap"><select value={form.questionType} onChange={(e) => update("questionType", e.target.value)}>{questionTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><ChevronDown size={16} /></span></label>
                  <label>Kelas sasaran<span className="select-wrap"><select value={form.grade} onChange={(e) => update("grade", Number(e.target.value))}>{[4,5,6,7,8,9,10,11,12].map((grade) => <option key={grade} value={grade}>Kelas {grade}</option>)}</select><ChevronDown size={16} /></span></label>
                </div>
                <label className="field-label">Teks soal <span>Gunakan $...$ untuk LaTeX inline</span></label>
                <div className="editor-toolbar"><strong>B</strong><em>I</em><span>LaTeX</span><span>Tabel</span><span>Gambar</span></div>
                <textarea className="question-editor" value={form.questionText} onChange={(e) => update("questionText", e.target.value)} />

                {form.questionType.includes("multiple") && <div className="options-editor">
                  <div className="field-label">Pilihan jawaban <span>Pilih radio sebagai kunci</span></div>
                  {form.options.map((option, index) => <div className="option-row" key={index}>
                    <input type="radio" name="correct" checked={form.correctAnswer === index} onChange={() => update("correctAnswer", index)} aria-label={`Jadikan pilihan ${index + 1} sebagai kunci`} />
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span><input value={option} onChange={(e) => setOption(index, e.target.value)} /><button aria-label={`Hapus pilihan ${index + 1}`}><Trash2 size={16} /></button>
                  </div>)}
                  <button className="text-button" onClick={() => update("options", [...form.options, "Pilihan baru"])}><Plus size={16} /> Tambah pilihan</button>
                </div>}

                <div className="upload-zone" onClick={() => fileInput.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }} role="button" tabIndex={0}>
                  {upload.status === "processing" ? <LoaderCircle className="spin" /> : upload.status === "ready" ? <FileImage /> : <ImagePlus />}
                  <div><strong>{upload.name || "Impor sumber soal"}</strong><span>PDF, PNG, JPG, JSON, atau CSV. Maks. 10 MB.</span></div><button>{upload.status === "ready" ? "Ganti file" : "Pilih file"}</button>
                  <input ref={fileInput} hidden type="file" accept=".pdf,.png,.jpg,.jpeg,.json,.csv" onChange={handleUpload} />
                </div>

                <div className="preview-block">
                  <div className="block-heading"><div><span>PRATINJAU SISWA</span><strong>Soal matematika</strong></div><FlaskConical size={19} /></div>
                  <p className="preview-question"><MathText>{form.questionText}</MathText></p>
                  {form.questionType.includes("multiple") && form.options.map((option, index) => <div className="preview-option" key={index}><span>{String.fromCharCode(65 + index)}</span><MathText>{option}</MathText></div>)}
                  <GeometryBoard />
                </div>
              </>}
            </section>

            <aside className="inspector">
              <section className="inspector-section">
                <div className="inspector-title"><ListChecks size={18} /><div><strong>Pelabelan pedagogis</strong><span>Label guru adalah estimasi awal.</span></div></div>
                <label className="field-label">Proses kognitif</label><div className="segmented six">{bloomOptions.map((item) => <button key={item.level} className={form.bloom === item.level ? "active" : ""} onClick={() => update("bloom", item.level)}>{item.level}<small>{item.name}</small></button>)}</div>
                <label className="field-label">Dimensi pengetahuan</label><div className="segmented knowledge">{knowledgeOptions.map((item) => <button key={item.id} className={form.knowledgeDimension === item.id ? "active" : ""} onClick={() => update("knowledgeDimension", item.id)}>{item.label}</button>)}</div>
                <label className="field-label">Difficulty yang dimaksudkan</label><div className="segmented">{["Easy", "Medium", "Hard"].map((item) => <button key={item} className={form.difficulty === item ? "active" : ""} onClick={() => update("difficulty", item)}>{item}</button>)}</div>
              </section>
              <section className="inspector-section">
                <div className="field-row two compact"><label>Topik<input value={form.topic} onChange={(e) => update("topic", e.target.value)} /></label><label>Subtopik<input value={form.subtopic} onChange={(e) => update("subtopic", e.target.value)} /></label></div>
                <label>Tujuan pembelajaran<textarea value={form.learningObjective} onChange={(e) => update("learningObjective", e.target.value)} /></label>
                <label>Langkah penalaran: <strong>{form.reasoningSteps}</strong><input type="range" min="1" max="6" value={form.reasoningSteps} onChange={(e) => update("reasoningSteps", Number(e.target.value))} /></label>
                <label>Sumber/referensi<input value={form.sourceReference} onChange={(e) => update("sourceReference", e.target.value)} /></label>
              </section>
              <section className="model-panel">
                <div className="model-heading"><Sparkles size={18} /><div><strong>Saran model</strong><span>{remoteSuggestion ? "Layanan AI" : "Baseline lokal"} · bukan keputusan final</span></div><b>{Math.round(suggestion.confidence * 100)}%</b></div>
                <div className="model-labels"><span>{suggestion.bloom}</span><span>{knowledgeOptions.find((item) => item.id === suggestion.knowledge)?.label}</span><span>{suggestion.difficulty}</span></div>
                <p>Prediksi mempertimbangkan konteks teks, struktur soal, panjang, dan jumlah langkah. Konfirmasi tetap dilakukan annotator independen.</p>
              </section>
              <section className="expertise-panel">
                <div className="inspector-title"><ShieldCheck size={18} /><div><strong>Bukti kepakaran</strong><span>KYC/KYB pendidik berbasis bukti.</span></div></div>
                {evidence.map((item) => <div className="evidence-row" key={item.source}><UserRoundCheck size={17} /><div><strong>{item.source}</strong><span>{item.detail}</span></div><b>{item.status}</b></div>)}<button className="text-button">Lihat detail verifikasi</button>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function CoveragePanel() {
  return <div className="coverage-panel">
    <div className="coverage-summary"><BookOpen size={22} /><div><strong>{mathQuestions.length} soal seed demonstrasi</strong><span>Mencakup C1–C6 dan empat dimensi pengetahuan. Label belum boleh dipakai sebagai gold dataset.</span></div></div>
    <div className="coverage-grid">{taxonomyCoverage.map((item) => <article key={item.level}><span>{item.level}</span><strong>{item.name}</strong><p>{item.count} soal · 4 dimensi pengetahuan</p></article>)}</div>
    <div className="seed-list">{mathQuestions.slice(0, 12).map((question) => <div key={question.id}><code>{question.id}</code><span><MathText>{question.questionText}</MathText></span><b>{question.difficulty}</b></div>)}</div>
  </div>;
}
