import React from "react";
import { Award, Trophy, Sparkles } from "lucide-react";
import Modal from "./Modal";

/**
 * Modal hasil Pretest & Post Test di Topics.jsx — dua-duanya punya struktur
 * identik (skor, benar/salah, durasi, breakdown per subbab, rekomendasi),
 * cuma beda warna tema & beberapa label teks. Digabung jadi satu komponen
 * dengan prop `variant` ("pretest" | "posttest") biar gak duplikasi ~70 baris.
 */
const VARIANTS = {
    pretest: {
        icon: Award,
        iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        title: "Hasil Diagnostic Pretest",
        scoreLabel: "Skor Pretest",
        scoreColor: "text-primary",
        breakdownTitle: "Breakdown Pemahaman per Subbab",
        getBadgeClass: (status) =>
            status === "Kuasai"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200",
        recommendationTitle: "Rekomendasi Pembelajaran",
        recommendationBg: "bg-blue-50/60 border-blue-100",
        recommendationTextColor: "text-primary",
    },
    posttest: {
        icon: Trophy,
        iconBg: "bg-purple-50 text-purple-700 border-purple-200",
        title: "Hasil Evaluasi Post Test",
        scoreLabel: "Skor Akhir",
        scoreColor: "text-purple-700",
        breakdownTitle: "Breakdown Ketuntasan Subbab",
        getBadgeClass: () =>
            "bg-purple-50 text-purple-700 border border-purple-200",
        recommendationTitle: "Ulasan Evaluasi Akhir",
        recommendationBg: "bg-purple-50/60 border-purple-100",
        recommendationTextColor: "text-purple-700",
    },
};

const TestResultModal = ({ variant, chapterName, result, onClose }) => {
    const config = VARIANTS[variant];
    const Icon = config.icon;

    return (
        <Modal onClose={onClose} maxWidth="max-w-lg" scrollable>
            <div className="flex items-center gap-2.5 mb-4">
                <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${config.iconBg}`}
                >
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-neutral-text">
                        {config.title}
                    </h3>
                    <p className="text-xs text-neutral-muted">BAB: {chapterName}</p>
                </div>
            </div>

            {/* Skor & Ringkasan */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 bg-neutral-bg p-3.5 rounded-xl border border-neutral-border text-center">
                <div>
                    <p className="text-[11px] text-neutral-muted">{config.scoreLabel}</p>
                    <p className={`text-xl font-bold mt-0.5 ${config.scoreColor}`}>
                        {result.score}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] text-neutral-muted">Benar / Salah</p>
                    <p className="text-sm font-semibold text-neutral-text mt-1">
                        <span className="text-emerald-600">{result.correctCount}</span>{" "}
                        / <span className="text-danger">{result.wrongCount}</span>
                    </p>
                </div>
                <div>
                    <p className="text-[11px] text-neutral-muted">Durasi</p>
                    <p className="text-xs font-semibold text-neutral-text mt-1.5">
                        {result.duration}
                    </p>
                </div>
            </div>

            {/* Breakdown per Subbab */}
            <div className="mb-5">
                <h4 className="text-xs font-bold text-neutral-text uppercase tracking-wider mb-2.5">
                    {config.breakdownTitle}
                </h4>
                <div className="space-y-2">
                    {result.breakdown.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-neutral-bg/60 rounded-lg border border-neutral-border text-xs"
                        >
                            <span className="font-medium text-neutral-text">
                                {item.subtopic}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-neutral-muted text-[11px]">
                                    {item.score}
                                </span>
                                <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${config.getBadgeClass(
                                        item.status,
                                    )}`}
                                >
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rekomendasi */}
            <div className={`p-3.5 border rounded-xl mb-5 ${config.recommendationBg}`}>
                <div
                    className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${config.recommendationTextColor}`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    {config.recommendationTitle}
                </div>
                <p className="text-xs text-neutral-muted leading-relaxed">
                    {result.recommendation}
                </p>
            </div>

            <button
                onClick={onClose}
                className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
            >
                Tutup Ringkasan
            </button>
        </Modal>
    );
};

export default TestResultModal;