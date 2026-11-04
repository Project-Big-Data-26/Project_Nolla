import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, LogOut, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import QuestionImage from "../../components/QuestionImage";
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

// Salinan tampilan halaman soal (Student/QuestionPage.jsx, mode kuis) khusus pintu cek
// soal staging (FE-09). Halaman siswa tidak diubah. Tanpa sesi kuis, timer, submit,
// sessionStorage, maupun event analytics; data dari /staging/soal-check.
const normalizeQuestion = (question) => ({
  id: String(question.question_id),
  text: question.question_text || "",
  options: (question.options || []).map((option) => ({
    id: String(option.option_id),
    text: option.text ?? "",
  })),
  images: Array.isArray(question.image_url)
    ? question.image_url
    : question.image_url
      ? [question.image_url]
      : [],
});

const StagingQuestionPageContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subbabId, soalId, number, at, review, aprove } = readCheckTarget(searchParams);
  const startRef = useRef({ number, at });
  const isFiltered = Boolean(subbabId) && hasCheckFilter({ review, aprove });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Pilihan opsi hanya untuk melihat tampilan terpilih; tidak disimpan.
  const [answers, setAnswers] = useState({});
  const [stagingChecks, setStagingChecks] = useState({});
  const [summary, setSummary] = useState(null);

  const questionContentRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    fetchSoalCheckItems({ subbabId, soalId, page: "question", review, aprove })
      .then(({ items, summary: nextSummary }) => {
        if (!isCurrent) return;
        setSummary(nextSummary ?? null);
        if (items.length === 0) {
          // Filter tanpa hasil bukan error; tampilkan pilihan filter lain.
          if (!isFiltered) setError("Subbab ini belum memiliki soal.");
          return;
        }
        setQuestions(items.map(normalizeQuestion));
        setStagingChecks(toCheckMetaMap(items));
        setCurrentIndex(getStartIndex(items, startRef.current));
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
  }, [subbabId, soalId, review, aprove, isFiltered, retryVersion]);

  const question = questions[currentIndex];


  useEffect(() => {
    if (questionContentRef.current) {
      questionContentRef.current.scrollTop = 0;
    }
  }, [question?.id]);

  const backToBrowser = () => navigate("/staging/cek-soal");

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-bg">
        <Navbar activePage="Topik" />
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
              page="question"
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
        <Navbar activePage="Topik" />
        <main className="flex flex-1 items-center justify-center p-5 pb-24 md:pb-5">
          <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6">
            <h1 className="text-lg font-bold text-slate-900">Soal tidak dapat dimuat</h1>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setRetryVersion((value) => value + 1);
                }}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Coba lagi
              </button>
              <button
                type="button"
                onClick={backToBrowser}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                Pilih subbab
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const hasImage = question.images.length > 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedForQuestion = answers[question.id] ?? null;
  // Pindah ke review untuk soal yang sama (lewat soal_id; daftar terfilter bisa berbeda).
  const reviewHref = buildCheckUrl("review", {
    subbabId,
    soalId,
    review,
    aprove,
    at: question.id,
  });

  const handleContinue = () => {
    if (isLastQuestion) navigate(reviewHref);
    else setCurrentIndex(currentIndex + 1);
  };

  const renderOptions = () =>
    question.options.map((option) => {
      const isSelected = selectedForQuestion === option.id;

      return (
        <button
          key={option.id}
          type="button"
          onClick={() => setAnswers({ ...answers, [question.id]: option.id })}
          className={`flex w-full items-start gap-3 rounded-2xl p-2.5 text-left transition-all duration-200 disabled:cursor-not-allowed sm:items-center sm:gap-4 sm:p-3.5 ${
            isSelected
              ? "bg-primary text-white"
              : "border border-slate-100 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:mt-0 sm:h-9 sm:w-9 sm:text-sm ${
              isSelected ? "bg-white text-primary" : "bg-primary/10 text-primary"
            }`}
          >
            {option.id}
          </div>

          <span className="min-w-0 flex-1 text-[13px] font-medium leading-relaxed sm:text-sm sm:font-semibold">
            <MarkdownInline content={option.text} />
          </span>
        </button>
      );
    });

  const renderNavigation = () => (
    <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-slate-100 pt-3 md:justify-end sm:gap-3">
      <button
        type="button"
        onClick={() => setCurrentIndex(Math.max(currentIndex - 1, 0))}
        disabled={currentIndex === 0}
        className="flex min-h-9 items-center justify-center rounded-2xl bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm sm:font-bold"
      >
        Sebelumnya
      </button>

      <button
        type="button"
        onClick={handleContinue}
        className="flex min-h-9 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-[11px] font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-sm sm:font-bold"
      >
        {isLastQuestion ? "Lihat review" : "Selanjutnya"}
      </button>
    </div>
  );

  const questionText = (
    <div className="min-w-0 whitespace-pre-wrap text-justify text-[13px] font-medium leading-[1.55] text-slate-800 sm:text-left sm:text-sm sm:font-semibold md:text-base">
      <MarkdownBlock content={question.text} />
    </div>
  );

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-neutral-bg font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col overflow-y-auto p-4 pb-20 sm:p-5 sm:pb-20 md:overflow-hidden md:p-6 md:pb-6">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-3.5 sm:gap-4">
          <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-3">
            <button
              type="button"
              onClick={backToBrowser}
              aria-label="Keluar dari cek soal"
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 sm:px-2.5"
            >
              <LogOut size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            <NumberPager
              total={questions.length}
              current={currentIndex}
              onSelect={setCurrentIndex}
              label="Navigasi nomor soal"
              renderNumber={(index) => {
                const item = questions[index];
                const sequence = index + 1;
                const isCurrent = index === currentIndex;
                // Tanda nomor = hasil cek halaman soal.
                const checkValue = stagingChecks[item.id]?.check?.question?.value ?? null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Soal ${sequence}`}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative flex h-7 min-w-7 shrink-0 cursor-pointer items-center justify-center rounded-full px-1 text-xs font-semibold transition-all sm:h-8 sm:min-w-8 ${
                      isCurrent
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {sequence}

                    {checkValue === true && !isCurrent && (
                      <Check
                        aria-hidden="true"
                        className="absolute -right-0.5 -top-0.5 rounded-full bg-white text-primary"
                        size={13}
                      />
                    )}

                    {checkValue === false && !isCurrent && (
                      <X
                        aria-hidden="true"
                        className="absolute -right-0.5 -top-0.5 rounded-full bg-white text-rose-600"
                        size={13}
                      />
                    )}
                  </button>
                );
              }}
            />

            <div className="flex shrink-0 flex-col items-end rounded-xl border border-primary/20 bg-primary/10 px-3 py-1 sm:py-1.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-primary sm:text-[9px]">
                MODE CEK SOAL
              </span>
              <span className="font-mono text-xs font-extrabold leading-none text-primary sm:text-sm sm:leading-normal">
                STAGING
              </span>
            </div>
          </div>

          {subbabId && (
            <CheckFilterBar
              page="question"
              subbabId={subbabId}
              review={review}
              aprove={aprove}
              summary={summary}
            />
          )}

          <StagingSoalCheckPanel
            key={question.id}
            meta={stagingChecks[question.id]}
            page="question"
            showSequence={Boolean(subbabId)}
            onUpdated={(meta) =>
              setStagingChecks((previous) => ({ ...previous, [meta.id]: meta }))
            }
            switchTo={{ href: reviewHref, label: "Lihat di review" }}
          />

          <div ref={questionContentRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-3 md:pb-0">
            {hasImage ? (
              <div className="grid h-full grid-cols-1 items-stretch gap-3 sm:gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <div className="shrink-0 rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-5">
                    {questionText}
                  </div>

                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
                    <div className="flex h-full w-full items-center justify-center gap-3">
                      {question.images.map((imageUrl) => (
                        <QuestionImage
                          key={imageUrl}
                          src={imageUrl}
                          alt="Ilustrasi Soal"
                          className="h-full w-full rounded-xl object-contain"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-6">
                  <div className="flex flex-1 flex-col justify-center space-y-2.5 sm:space-y-3">
                    {renderOptions()}
                  </div>
                  {renderNavigation()}
                </div>
              </div>
            ) : (
              <div className="flex h-auto flex-col gap-3 sm:gap-4">
                <div className="shrink-0 rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-5">
                  {questionText}
                </div>

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

// Pasang ulang saat query berubah (ganti filter/subbab) agar status & posisi awal bersih.
const StagingQuestionPage = () => {
  const [searchParams] = useSearchParams();
  return <StagingQuestionPageContent key={searchParams.toString()} />;
};

export default StagingQuestionPage;
