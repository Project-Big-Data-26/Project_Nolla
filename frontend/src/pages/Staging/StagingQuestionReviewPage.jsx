import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import Navbar from "../../components/Navbar";
import QuestionImageGallery from "../../components/QuestionImageGallery";
import StagingSoalCheckPanel from "../../components/StagingSoalCheckPanel";
import NumberPager from "./NumberPager";
import {
  buildCheckUrl,
  fetchSoalCheckItems,
  getCheckErrorMessage,
  getStartIndex,
  hasCheckFilter,
  readCheckTarget,
  toCheckMetaMap,
} from "../../api/stagingSoalCheck";
import CheckFilterBar from "./CheckFilterBar";
import { MarkdownBlock, MarkdownInline } from "./stagingMarkdown";

// Salinan tampilan halaman review (Student/QuestionReviewPage.jsx) khusus pintu cek soal
// staging (FE-09). Halaman siswa tidak diubah. Kunci jawaban ditampilkan tanpa jawaban
// siswa; tanpa event analytics.
const toReviewQuestion = (item) => ({
  id: String(item.question_id),
  question: item.question_text || "",
  images: Array.isArray(item.image_url)
    ? item.image_url
    : item.image_url
      ? [item.image_url]
      : [],
  options: (item.options || []).map((option) => ({
    label: String(option.option_id),
    value: option.text,
  })),
  correctAnswer: item.correct_answer ?? null,
});

const StagingQuestionReviewPageContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subbabId, soalId, number, at, review, aprove } = readCheckTarget(searchParams);
  const startRef = useRef({ number, at });
  const isFiltered = Boolean(subbabId) && hasCheckFilter({ review, aprove });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [stagingChecks, setStagingChecks] = useState({});
  const [summary, setSummary] = useState(null);

  const questionContentRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    fetchSoalCheckItems({ subbabId, soalId, page: "review", review, aprove })
      .then(({ items, summary: nextSummary }) => {
        if (!isCurrent) return;
        setSummary(nextSummary ?? null);
        if (items.length === 0) {
          // Filter tanpa hasil bukan error; tampilkan pilihan filter lain.
          if (!isFiltered) setError("Subbab ini belum memiliki soal.");
          return;
        }
        setQuestions(items.map(toReviewQuestion));
        setStagingChecks(toCheckMetaMap(items));
        setCurrentQuestion(getStartIndex(items, startRef.current));
        setError("");
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(getCheckErrorMessage(requestError, "Soal untuk dicek gagal dimuat."));
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [subbabId, soalId, review, aprove, isFiltered]);

  const question = questions[currentQuestion];

  useEffect(() => {
    if (questionContentRef.current) {
      questionContentRef.current.scrollTop = 0;
    }
  }, [question?.id]);


  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm font-semibold text-slate-600">Memuat soal untuk dicek...</p>
        </main>
      </div>
    );
  }

  if (!error && isFiltered && questions.length === 0) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-5 pb-24 md:pb-5">
          <section className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-lg font-bold text-slate-900">Tidak ada soal yang cocok dengan filter ini</h1>
            <CheckFilterBar
              page="review"
              subbabId={subbabId}
              review={review}
              aprove={aprove}
              summary={summary}
            />
            <button
              type="button"
              onClick={() => navigate("/staging/cek-soal")}
              className="self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              Pilih subbab
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <section className="max-w-md rounded-2xl border border-red-200 bg-white p-5">
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/staging/cek-soal")}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              Pilih subbab
            </button>
          </section>
        </main>
      </div>
    );
  }

  const hasImage = Boolean(question.images?.length);
  const isLastQuestion = currentQuestion === questions.length - 1;
  // Pindah ke halaman soal untuk soal yang sama (lewat soal_id; daftar terfilter bisa berbeda).
  const questionHref = buildCheckUrl("question", {
    subbabId,
    soalId,
    review,
    aprove,
    at: question.id,
  });

  const handleNext = () => {
    if (isLastQuestion) navigate(buildCheckUrl("question", { subbabId, soalId, review, aprove }));
    else setCurrentQuestion(currentQuestion + 1);
  };

  const renderOptions = () =>
    question.options.map((opt) => {
      const isCorrectAnswer =
        question.correctAnswer !== null && opt.label === String(question.correctAnswer);

      return (
        <div
          key={opt.label}
          className={`w-full flex items-start sm:items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl text-left border transition-all ${
            isCorrectAnswer
              ? "bg-emerald-600 text-white"
              : "bg-slate-50/80 text-slate-700 border-slate-100"
          }`}
        >
          <div
            className={`mt-0.5 sm:mt-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
              isCorrectAnswer ? "bg-white text-emerald-700" : "bg-slate-200/60 text-slate-600"
            }`}
          >
            {opt.label}
          </div>

          <span className="min-w-0 flex-1 text-[13px] leading-relaxed font-medium sm:text-sm sm:font-semibold">
            <MarkdownInline content={opt.value} />
          </span>

          {isCorrectAnswer && <Check className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />}
        </div>
      );
    });

  const navigationButtons = (
    <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 shrink-0">
      <button
        type="button"
        onClick={() => setCurrentQuestion(Math.max(currentQuestion - 1, 0))}
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
        {isLastQuestion ? "Ke soal nomor 1" : "Selanjutnya"}
      </button>
    </div>
  );

  const questionText = (
    <div className="min-w-0 text-justify text-[13px] leading-[1.55] font-medium text-slate-800 sm:text-left sm:text-sm sm:font-semibold md:text-base">
      <MarkdownBlock content={question.question} />
    </div>
  );

  return (
    <div className="flex h-screen max-h-screen w-full bg-neutral-bg font-sans overflow-hidden">
      <Navbar />

      <main className="flex flex-1 flex-col overflow-y-auto p-4 pb-20 sm:p-5 sm:pb-20 md:overflow-hidden md:p-6 md:pb-6">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-100 shrink-0">
            <NumberPager
              total={questions.length}
              current={currentQuestion}
              onSelect={setCurrentQuestion}
              label="Navigasi nomor soal review"
              renderNumber={(idx) => {
                const q = questions[idx];
                const isActive = idx === currentQuestion;
                // Warna nomor = hasil cek halaman review.
                const checkValue = stagingChecks[q.id]?.check?.review?.value ?? null;
                const badgeBg =
                  checkValue === true
                    ? "bg-emerald-600 text-white"
                    : checkValue === false
                      ? "bg-rose-500 text-white"
                      : "bg-slate-400 text-white";

                return (
                  <button
                    key={q.id}
                    type="button"
                    aria-label={`Soal ${idx + 1}`}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`h-7 min-w-7 px-1 sm:h-8 sm:min-w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shrink-0 ${badgeBg} ${
                      isActive
                        ? "opacity-100 font-extrabold scale-105"
                        : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              }}
            />

            <div className="bg-slate-100 border border-slate-200 px-3 py-1 sm:py-1.5 rounded-xl flex flex-col items-end shrink-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                MODE CEK SOAL
              </span>
              <span className="text-right text-[10px] font-extrabold leading-tight text-slate-700 sm:text-sm">
                STAGING
              </span>
            </div>
          </div>

          {subbabId && (
            <CheckFilterBar
              page="review"
              subbabId={subbabId}
              review={review}
              aprove={aprove}
              summary={summary}
            />
          )}

          <StagingSoalCheckPanel
            key={question.id}
            meta={stagingChecks[question.id]}
            page="review"
            showSequence={Boolean(subbabId)}
            onUpdated={(meta) =>
              setStagingChecks((previous) => ({ ...previous, [meta.id]: meta }))
            }
            switchTo={{ href: questionHref, label: "Lihat di halaman soal" }}
          />

          <div ref={questionContentRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-3 md:pb-0">
            {hasImage ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 h-full items-stretch">
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shrink-0">
                    {questionText}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 flex min-h-0 items-center justify-center flex-1">
                    <QuestionImageGallery images={question.images} />
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6 overflow-y-auto">
                  <div className="flex flex-col space-y-2.5 sm:space-y-3 justify-center flex-1">
                    {renderOptions()}
                  </div>
                  {navigationButtons}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4 h-auto">
                <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shrink-0">
                  {questionText}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                    {renderOptions()}
                  </div>
                  {navigationButtons}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Pasang ulang saat query berubah (ganti filter/subbab) agar status & posisi awal bersih.
const StagingQuestionReviewPage = () => {
  const [searchParams] = useSearchParams();
  return <StagingQuestionReviewPageContent key={searchParams.toString()} />;
};

export default StagingQuestionReviewPage;
