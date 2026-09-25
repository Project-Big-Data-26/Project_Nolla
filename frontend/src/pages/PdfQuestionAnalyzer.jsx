import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSearch,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { BlockMath } from "react-katex";
import MathText from "../components/MathText";
import { classifyQuestion, extractSource } from "../services/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BLOOM_LEVELS = ["C1", "C2", "C3", "C4", "C5", "C6"];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];
const KNOWLEDGE_LEVELS = ["factual", "conceptual", "procedural", "metacognitive"];

const BLOOM_NAMES = {
  C1: "Mengingat",
  C2: "Memahami",
  C3: "Menerapkan",
  C4: "Menganalisis",
  C5: "Mengevaluasi",
  C6: "Mencipta",
};

const KNOWLEDGE_NAMES = {
  factual: "Faktual",
  conceptual: "Konseptual",
  procedural: "Prosedural",
  metacognitive: "Metakognitif",
};

function percent(value) {
  return value == null ? "–" : `${Math.round(value * 100)}%`;
}

function countBy(questions, values, selector) {
  return values.map((value) => ({
    value,
    count: questions.filter((question) => selector(question) === value).length,
  }));
}

async function classifyCandidates(candidates, analysisId) {
  const results = [];
  const concurrency = 4;
  for (let start = 0; start < candidates.length; start += concurrency) {
    const batch = candidates.slice(start, start + concurrency);
    const settled = await Promise.allSettled(batch.map((candidate, offset) => {
      const index = start + offset;
      if ((candidate.question_text || "").trim().length < 10) {
        return Promise.reject(new Error("Teks soal kurang dari 10 karakter."));
      }
      return classifyQuestion({
        question_id: `PDF-${analysisId}-${candidate.question_number || index + 1}`,
        question_text: candidate.classification_text || candidate.question_text,
        question_type: candidate.options.length ? "multiple_choice" : "essay",
        subject: "Matematika",
        options: candidate.options.map((option) => option.text),
      });
    }));
    results.push(...settled);
  }
  return results;
}

function Distribution({ title, items, labelFor = (value) => value }) {
  const maximum = Math.max(1, ...items.map((item) => item.count));
  return (
    <section className="distribution-card">
      <h3>{title}</h3>
      <div className="distribution-list">
        {items.map((item) => (
          <div className="distribution-row" key={item.value}>
            <span>{labelFor(item.value)}</span>
            <div className="distribution-track" aria-hidden="true">
              <i style={{ width: `${(item.count / maximum) * 100}%` }} />
            </div>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PdfPageCanvas({ documentProxy, pageNumber }) {
  const canvasRef = useRef(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let renderTask;
    async function renderPage() {
      try {
        setRenderError("");
        const page = await documentProxy.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (error) {
        if (!cancelled && error?.name !== "RenderingCancelledException") {
          setRenderError(error?.message || "Halaman PDF gagal ditampilkan.");
        }
      }
    }
    renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [documentProxy, pageNumber]);

  if (renderError) {
    return <div className="viewer-error"><AlertTriangle size={18} /> {renderError}</div>;
  }
  return <canvas ref={canvasRef} className="pdf-page-canvas" aria-label={`Halaman asli PDF ${pageNumber}`} />;
}

function OriginalPdfViewer({ file, activePage, onPageChange }) {
  const [documentProxy, setDocumentProxy] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask;
    async function loadPdf() {
      try {
        setLoadError("");
        setDocumentProxy(null);
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const assetBase = `${import.meta.env.BASE_URL}pdfjs`;
        loadingTask = pdfjs.getDocument({
          data: bytes,
          cMapUrl: `${assetBase}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assetBase}/standard_fonts/`,
          wasmUrl: `${assetBase}/wasm/`,
        });
        const loaded = await loadingTask.promise;
        if (!cancelled) setDocumentProxy(loaded);
      } catch (error) {
        if (!cancelled) setLoadError(error?.message || "Preview PDF gagal dimuat.");
      }
    }
    loadPdf();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [file]);

  const totalPages = documentProxy?.numPages || 0;
  const safePage = Math.min(Math.max(activePage, 1), Math.max(totalPages, 1));

  return (
    <section className="original-viewer">
      <div className="original-viewer-heading">
        <div>
          <span className="eyebrow">SUMBER VISUAL</span>
          <h2>Halaman PDF asli</h2>
          <p>Gambar, tabel, angka, dan rumus ditampilkan langsung dari PDF tanpa dibangun ulang oleh OCR.</p>
        </div>
        {totalPages > 0 && (
          <div className="page-navigation">
            <button type="button" aria-label="Halaman sebelumnya" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
              <ChevronLeft size={17} />
            </button>
            <span>Halaman <strong>{safePage}</strong> / {totalPages}</span>
            <button type="button" aria-label="Halaman berikutnya" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>
      <div className="pdf-canvas-shell">
        {loadError && <div className="viewer-error"><AlertTriangle size={18} /> {loadError}</div>}
        {!loadError && !documentProxy && <div className="viewer-loading"><LoaderCircle className="spin" size={20} /> Memuat halaman asli…</div>}
        {documentProxy && <PdfPageCanvas documentProxy={documentProxy} pageNumber={safePage} />}
      </div>
    </section>
  );
}

function QuestionCard({ item, index, onViewPage }) {
  const prediction = item.classification;
  const extraction = item.extraction;
  const failed = item.classification_error;
  const formulas = extraction.math_formulas || [];

  return (
    <article className="question-card">
      {extraction.visual_previews?.length > 0 && (
        <section className="generated-question-visual">
          <div>
            <span>TAMPILAN SOAL HASIL EKSTRAKSI</span>
            <small>Gambar platform · bukan viewer PDF</small>
          </div>
          {extraction.visual_previews.map((preview) => (
            <figure key={`${extraction.candidate_id}-${preview.page_number}`}>
              <img
                src={preview.data_url}
                alt={`Soal ${extraction.question_number || index + 1} dari halaman ${preview.page_number}`}
                width={preview.width}
                height={preview.height}
              />
              <figcaption>Halaman {preview.page_number} · {preview.crop_method === "question_bounds" ? "dipotong sesuai batas soal" : "fallback satu halaman"}</figcaption>
            </figure>
          ))}
        </section>
      )}

      <div className="question-heading">
        <div className="question-number">{extraction.question_number || index + 1}</div>
        <div>
          <span className="question-kicker">
            Kandidat {extraction.candidate_id} · halaman {extraction.page_numbers.join(", ")}
          </span>
          {formulas.length > 0 ? (
            <h3>{formulas.length} formula matematika berhasil direkonstruksi</h3>
          ) : (
            <h3><MathText>{extraction.question_text}</MathText></h3>
          )}
        </div>
        <span className={`method-pill ${extraction.extraction_method}`}>
          {extraction.extraction_method === "text_layer" ? "Text layer" : "OCR / review"}
        </span>
      </div>

      {formulas.length > 0 && (
        <section className="math-reconstruction" aria-label="Formula matematika hasil rekonstruksi">
          <div className="math-reconstruction-heading">
            <div>
              <span>REKONSTRUKSI MATEMATIKA</span>
              <strong>LaTeX yang dirender oleh KaTeX</strong>
            </div>
            <small>Akar, pecahan, pangkat, integral, limit, sigma, dan simbol relasi dipertahankan secara dua dimensi.</small>
          </div>
          <div className="math-formula-grid">
            {formulas.map((formula, formulaIndex) => (
              <div className="math-formula-card" key={`${formula.page_number}-${formulaIndex}-${formula.latex}`}>
                <span>Formula {formulaIndex + 1}</span>
                <div className="math-formula-source">
                  <small>Visual formula asli</small>
                  <img
                    src={formula.visual_data_url}
                    alt={`Formula asli ${formulaIndex + 1}`}
                    width={formula.visual_width}
                    height={formula.visual_height}
                  />
                </div>
                {formula.latex_renderable ? (
                  <div className="math-formula-render">
                    <BlockMath
                      math={formula.latex}
                      renderError={() => <span className="formula-fallback">Gunakan visual formula asli di atas.</span>}
                    />
                  </div>
                ) : (
                  <span className="formula-fallback">LaTeX confidence rendah; visual asli dipertahankan.</span>
                )}
                <details>
                  <summary>Lihat kode LaTeX</summary>
                  <code>{formula.latex}</code>
                </details>
              </div>
            ))}
          </div>
        </section>
      )}

      {formulas.length > 0 && (
        <details className="ocr-classification-text">
          <summary>Lihat teks OCR yang dipakai sebagai bantuan klasifikasi</summary>
          <p><MathText>{extraction.question_text}</MathText></p>
        </details>
      )}

      {extraction.options.length > 0 && formulas.length === 0 && (
        <div className="answer-options">
          {extraction.options.map((option) => (
            <div className="answer-option" key={`${extraction.candidate_id}-${option.label}`}>
              <span>{option.label}</span>
              <MathText>{option.text}</MathText>
            </div>
          ))}
        </div>
      )}

      {failed ? (
        <div className="classification-error">
          <AlertTriangle size={18} />
          <span>Klasifikasi gagal: {failed}</span>
        </div>
      ) : (
        <div className="classification-grid">
          <div className="classification-item bloom">
            <span>Level Bloom</span>
            <strong>{prediction.bloom.label}</strong>
            <small>{BLOOM_NAMES[prediction.bloom.label] || "Belum dikenali"}</small>
            <b>{percent(prediction.bloom.confidence)}</b>
          </div>
          <div className="classification-item knowledge">
            <span>Dimensi pengetahuan</span>
            <strong>{KNOWLEDGE_NAMES[prediction.knowledge_dimension.label] || prediction.knowledge_dimension.label}</strong>
            <small>{prediction.knowledge_dimension.label}</small>
            <b>{percent(prediction.knowledge_dimension.confidence)}</b>
          </div>
          <div className="classification-item difficulty">
            <span>Difficulty</span>
            <strong>{prediction.difficulty.label}</strong>
            <small>Kesulitan yang diprediksi</small>
            <b>{percent(prediction.difficulty.confidence)}</b>
          </div>
        </div>
      )}

      <footer className="question-footer">
        <button type="button" className="source-page-button" onClick={() => onViewPage(extraction.page_numbers[0] || 1)}>
          <Eye size={14} /> Lihat sumber asli
        </button>
        <div>
          <span>{prediction?.prediction_source === "rules_baseline" ? "Baseline aturan" : "Model AI"}</span>
          {(prediction?.review_required || extraction.needs_review) && (
            <span className="review-flag"><AlertTriangle size={14} /> Perlu review</span>
          )}
        </div>
      </footer>
    </article>
  );
}

export default function PdfQuestionAnalyzer() {
  const inputRef = useRef(null);
  const sourceViewerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activePage, setActivePage] = useState(1);

  const classifiedQuestions = result?.questions.filter((item) => item.classification) || [];
  const distributions = {
    bloom: countBy(classifiedQuestions, BLOOM_LEVELS, (item) => item.classification.bloom.label),
    difficulty: countBy(classifiedQuestions, DIFFICULTY_LEVELS, (item) => item.classification.difficulty.label),
    knowledge: countBy(classifiedQuestions, KNOWLEDGE_LEVELS, (item) => item.classification.knowledge_dimension.label),
  };

  const selectFile = (selected) => {
    setError("");
    setResult(null);
    setActivePage(1);
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Format tidak didukung. Pilih file PDF.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Ukuran PDF melebihi batas 10 MB.");
      return;
    }
    setFile(selected);
  };

  const analyze = async () => {
    if (!file) return;
    setError("");
    setResult(null);
    setPhase("extracting");
    try {
      const extraction = await extractSource(file);
      const candidates = extraction.questions || [];
      if (!candidates.length) {
        throw new Error(extraction.warnings?.[0] || "Tidak ada kandidat soal yang ditemukan dalam PDF.");
      }

      setPhase("classifying");
      const analysisId = Date.now();
      const settled = await classifyCandidates(candidates, analysisId);

      const questions = candidates.map((candidate, index) => ({
        extraction: candidate,
        classification: settled[index].status === "fulfilled" ? settled[index].value : null,
        classification_error: settled[index].status === "rejected"
          ? settled[index].reason?.message || "Klasifikasi gagal."
          : null,
      }));

      setResult({
        filename: file.name,
        analyzed_at: new Date().toISOString(),
        extraction: {
          status: extraction.status,
          confidence: extraction.confidence,
          review_required: extraction.review_required,
          warnings: extraction.warnings,
          document_metadata: extraction.document_metadata,
        },
        questions,
      });
      setActivePage(1);
      setPhase("done");
    } catch (requestError) {
      setError(requestError.message || "PDF gagal dianalisis.");
      setPhase("error");
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setPhase("idle");
    setActivePage(1);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.filename.replace(/\.pdf$/i, "")}.analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const busy = phase === "extracting" || phase === "classifying";
  const showSourcePage = (pageNumber) => {
    setActivePage(pageNumber);
    window.requestAnimationFrame(() => sourceViewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main className="analysis-page">
      <header className="analysis-header">
        <div className="brand-symbol"><FileSearch size={24} /></div>
        <div>
          <strong>Nalar</strong>
          <span>PDF Question Analyzer</span>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">EKSTRAKSI & KLASIFIKASI SOAL</span>
          <h1>Unggah PDF, lihat struktur dan level setiap soal.</h1>
          <p>
            Sistem mengekstrak soal dari PDF lalu mengelompokkannya berdasarkan level Bloom,
            dimensi pengetahuan, dan tingkat kesulitan. Hasil tetap perlu direview.
          </p>
        </div>

        <div
          className={`pdf-dropzone ${dragActive ? "drag-active" : ""} ${file ? "has-file" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          {file ? (
            <>
              <div className="file-icon"><FileText size={28} /></div>
              <div className="selected-file">
                <strong>{file.name}</strong>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB · siap dianalisis</span>
              </div>
              <button className="secondary-action" type="button" onClick={() => inputRef.current?.click()}>
                Ganti PDF
              </button>
            </>
          ) : (
            <>
              <div className="upload-icon"><UploadCloud size={30} /></div>
              <div>
                <strong>Tarik PDF ke sini</strong>
                <span>atau pilih file dari perangkat · maksimum 10 MB</span>
              </div>
              <button className="secondary-action" type="button" onClick={() => inputRef.current?.click()}>
                Pilih PDF
              </button>
            </>
          )}
        </div>

        {error && <div className="page-error"><AlertTriangle size={18} /> {error}</div>}

        <button className="analyze-button" disabled={!file || busy} type="button" onClick={analyze}>
          {busy ? <LoaderCircle className="spin" size={19} /> : <Sparkles size={19} />}
          {phase === "extracting" ? "Mengekstrak PDF…" : phase === "classifying" ? "Mengklasifikasikan soal…" : "Analisis PDF"}
        </button>
      </section>

      {result && (
        <section className="results-section">
          <div className="results-heading">
            <div>
              <span className="eyebrow">HASIL ANALISIS</span>
              <h2>{result.questions.length} kandidat soal ditemukan</h2>
              <p>{result.filename} · {result.extraction.document_metadata?.page_count || "–"} halaman</p>
            </div>
            <div className="results-actions">
              <button type="button" onClick={reset}><RefreshCw size={16} /> PDF baru</button>
              <button type="button" onClick={downloadResult}><Download size={16} /> Unduh JSON</button>
            </div>
          </div>

          <div className="success-banner">
            <CheckCircle2 size={19} />
            <span>
              Ekstraksi selesai. {classifiedQuestions.length} dari {result.questions.length} soal berhasil diklasifikasikan.
            </span>
          </div>

          {result.extraction.warnings.length > 0 && (
            <div className="warning-banner">
              <AlertTriangle size={18} />
              <div>{result.extraction.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div>
            </div>
          )}

          <div ref={sourceViewerRef}>
            <OriginalPdfViewer file={file} activePage={activePage} onPageChange={setActivePage} />
          </div>

          <div className="overview-heading"><BarChart3 size={19} /><h2>Ringkasan kelompok</h2></div>
          <div className="distribution-grid">
            <Distribution title="Taksonomi Bloom" items={distributions.bloom} labelFor={(value) => `${value} · ${BLOOM_NAMES[value]}`} />
            <Distribution title="Difficulty" items={distributions.difficulty} />
            <Distribution title="Dimensi pengetahuan" items={distributions.knowledge} labelFor={(value) => KNOWLEDGE_NAMES[value]} />
          </div>

          <div className="question-list-heading">
            <h2>Hasil per soal</h2>
            <span>Prediksi model bersifat advisory dan perlu konfirmasi pengajar.</span>
          </div>
          <div className="question-list">
            {result.questions.map((item, index) => (
              <QuestionCard item={item} index={index} onViewPage={showSourcePage} key={item.extraction.candidate_id} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
