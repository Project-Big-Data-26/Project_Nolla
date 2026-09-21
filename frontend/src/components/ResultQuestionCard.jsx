import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import SectionCard from "./SectionCard";

/**
 * Kartu hasil per-soal di ResultPage (header soal, pertanyaan, daftar pilihan
 * dengan status benar/salah, status jawaban, dan pembahasan).
 * Dipisah dari ResultPage.jsx karena bloknya besar (~150 baris) dan dirender
 * berulang lewat `.map`, jadi lebih enak dibaca kalau jadi komponen sendiri.
 */
const ResultQuestionCard = ({ result }) => {
    const selected = result.options.find(
        (option) => option.label === result.selectedAnswer,
    );
    const isCorrect = selected?.correct;

    return (
        <SectionCard as="section">
            {/* HEADER SOAL */}
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {result.level}
                    </span>

                    <span className="text-sm text-neutral-muted">
                        Soal {result.id}
                    </span>
                </div>

                <span className="text-sm text-neutral-muted">{result.topic}</span>
            </div>

            {/* PERTANYAAN */}
            <div className="text-lg md:text-xl font-medium text-neutral-text mb-5">
                {result.question}
            </div>

            {/* PILIHAN JAWABAN */}
            <div className="space-y-3">
                {result.options.map((option) => {
                    const isSelected = option.label === result.selectedAnswer;
                    const isCorrectAnswer = option.correct;

                    let containerClass = "border-neutral-border bg-neutral-card";
                    let labelClass = "border-neutral-border text-neutral-muted";

                    // Jawaban user BENAR
                    if (isSelected && isCorrectAnswer) {
                        containerClass = "border-green-300 bg-green-50";
                        labelClass = "border-green-400 text-green-600 bg-white";
                    }

                    // Jawaban user SALAH
                    if (isSelected && !isCorrectAnswer) {
                        containerClass = "border-red-300 bg-red-50";
                        labelClass = "border-red-400 text-red-500 bg-white";
                    }

                    // Jawaban sebenarnya
                    if (!isSelected && isCorrectAnswer) {
                        containerClass = "border-green-300 bg-green-50";
                        labelClass = "border-green-400 text-green-600 bg-white";
                    }

                    return (
                        <div
                            key={option.label}
                            className={`min-h-[56px] flex items-center justify-between rounded-xl border-2 px-4 ${containerClass}`}
                        >
                            <div className="flex items-center gap-4">
                                <span
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-semibold ${labelClass}`}
                                >
                                    {option.label}
                                </span>

                                <span className="text-sm md:text-base text-neutral-text">
                                    {option.value}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {isSelected && isCorrectAnswer && (
                                    <CheckCircle2 size={21} className="text-green-600" />
                                )}

                                {isSelected && !isCorrectAnswer && (
                                    <XCircle size={21} className="text-red-500" />
                                )}

                                {!isSelected && isCorrectAnswer && (
                                    <span className="text-xs font-medium text-green-600">
                                        Jawaban benar
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* STATUS */}
            <div
                className={`mt-5 rounded-xl p-4 flex items-center gap-3 ${isCorrect
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}
            >
                {isCorrect ? <CheckCircle2 size={19} /> : <XCircle size={19} />}

                <span className="text-sm font-semibold">
                    {isCorrect ? "Jawaban benar!" : "Jawaban kamu kurang tepat."}
                </span>
            </div>

            {/* PEMBAHASAN */}
            <div className="mt-4 bg-neutral-bg rounded-xl p-5">
                <p className="text-sm font-semibold text-primary mb-2">
                    Pembahasan
                </p>

                <div className="text-sm leading-6 text-neutral-muted">
                    {result.explanation}
                </div>
            </div>
        </SectionCard>
    );
};

export default ResultQuestionCard;