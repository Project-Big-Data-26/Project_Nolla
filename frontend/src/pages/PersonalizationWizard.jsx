import { useState } from 'react'
import {
    School,
    TrendingUp,
    Lightbulb,
    Target,
    Brain,
    Briefcase,
} from 'lucide-react'
import WizardOptionCard from '../components/WizardOptionCard'

const educationOptions = [
    { id: 'sd', label: 'SD', desc: 'Sekolah Dasar', icon: School },
    { id: 'smp', label: 'SMP', desc: 'Sekolah Menengah Pertama', icon: School },
    { id: 'sma', label: 'SMA', desc: 'Sekolah Menengah Atas', icon: School },
]

const learningGoalOptions = [
    { id: 'grades', label: 'Meningkatkan nilai', icon: TrendingUp },
    { id: 'skills', label: 'Belajar hal baru', icon: Lightbulb },
    { id: 'exams', label: 'Persiapan ujian', icon: Target },
    { id: 'understand', label: 'Memahami materi sulit', icon: Brain },
    { id: 'career', label: 'Persiapan karier', icon: Briefcase },
]

export default function PersonalizationWizard({ onFinish }) {
    const [step, setStep] = useState(1)
    const [educationLevel, setEducationLevel] = useState('')
    const [learningGoal, setLearningGoal] = useState('')

    return (
        <div className="min-h-screen bg-neutral-bg flex flex-col">

            <header className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                        B
                    </div>
                    <span className="font-heading font-semibold text-neutral-text">Big Data</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-muted">
                    <span className={step === 1 ? 'font-medium text-primary' : ''}>1 Jenjang Pendidikan</span>
                    <span className={step === 2 ? 'font-medium text-primary' : ''}>2 Tujuan Belajar</span>
                </div>

                <button className="text-sm text-neutral-muted hover:text-neutral-text">
                    Lewati
                </button>
            </header>

            <main className="flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-xl rounded-2xl border border-neutral-border bg-neutral-card p-8 shadow-sm">

                    {step === 1 && (
                        <>
                            <h1 className="font-heading text-xl font-bold text-neutral-text">
                                Hai, kenalan dulu yuk!
                            </h1>
                            <p className="mt-1 text-sm text-neutral-muted">
                                Pilih jenjang pendidikanmu supaya kami bisa menyesuaikan materi belajar.
                            </p>

                            <div className="mt-6 grid grid-cols-3 gap-3">
                                {educationOptions.map(({ id, label, desc, icon }) => (
                                    <WizardOptionCard
                                        key={id}
                                        icon={icon}
                                        label={label}
                                        desc={desc}
                                        selected={educationLevel === id}
                                        onClick={() => setEducationLevel(id)}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                disabled={!educationLevel}
                                onClick={() => setStep(2)}
                                className="mt-6 w-full rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Lanjut →
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className="font-heading text-xl font-bold text-neutral-text">
                                Apa tujuan belajarmu?
                            </h1>
                            <p className="mt-1 text-sm text-neutral-muted">
                                Pilih tujuan belajarmu supaya rekomendasi kami lebih tepat sasaran.
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                {learningGoalOptions.map(({ id, label, icon }) => (
                                    <WizardOptionCard
                                        key={id}
                                        icon={icon}
                                        label={label}
                                        selected={learningGoal === id}
                                        onClick={() => setLearningGoal(id)}
                                    />
                                ))}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="rounded-xl border border-neutral-border px-5 py-3 font-medium text-neutral-text transition hover:bg-neutral-bg"
                                >
                                    ← Kembali
                                </button>
                                <button
                                    type="button"
                                    disabled={!learningGoal}
                                    onClick={() => onFinish({ educationLevel, learningGoal })}
                                    className="flex-1 rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Lanjut →
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </main>
        </div>
    )
}