import { useState } from 'react'
import {
    School,
    GraduationCap,
    BookOpen,
    TrendingUp,
    Lightbulb,
    Target,
    Brain,
    Briefcase,
} from 'lucide-react'

const educationOptions = [
    { id: 'sd', label: 'SD', desc: 'Elementary School', icon: School },
    { id: 'smp', label: 'SMP', desc: 'Junior High School', icon: School },
    { id: 'sma', label: 'SMA / SMK', desc: 'Senior High School', icon: School },
    { id: 'kuliah', label: 'Perguruan Tinggi', desc: 'University', icon: GraduationCap },
    { id: 'umum', label: 'General Learner', desc: 'Belajar untuk semua kalangan', icon: BookOpen },
]

const learningGoalOptions = [
    { id: 'grades', label: 'Improve my grades', icon: TrendingUp },
    { id: 'skills', label: 'Learn new skills', icon: Lightbulb },
    { id: 'exams', label: 'Prepare for exams', icon: Target },
    { id: 'understand', label: 'Understand difficult topics', icon: Brain },
    { id: 'career', label: 'Prepare for career', icon: Briefcase },
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
                    <span className={step === 1 ? 'font-medium text-primary' : ''}>1 Education Level</span>
                    <span className={step === 2 ? 'font-medium text-primary' : ''}>2 Learning Goal</span>
                </div>

                <button className="text-sm text-neutral-muted hover:text-neutral-text">
                    Skip
                </button>
            </header>

            <main className="flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-xl rounded-2xl border border-neutral-border bg-neutral-card p-8 shadow-sm">

                    {step === 1 && (
                        <>
                            <h1 className="font-heading text-xl font-bold text-neutral-text">
                                Hi Learner, tell us about yourself!
                            </h1>
                            <p className="mt-1 text-sm text-neutral-muted">
                                Pilih jenjang pendidikanmu supaya kami bisa menyesuaikan materi belajar.
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                {educationOptions.map(({ id, label, desc, icon: Icon }) => {
                                    const isSelected = educationLevel === id
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setEducationLevel(id)}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
                                                isSelected
                                                    ? 'border-primary bg-blue-50'
                                                    : 'border-neutral-border hover:border-primary'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 text-primary" />
                                            <span className="font-medium text-neutral-text">{label}</span>
                                            <span className="text-xs text-neutral-muted">{desc}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                type="button"
                                disabled={!educationLevel}
                                onClick={() => setStep(2)}
                                className="mt-6 w-full rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Continue →
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className="font-heading text-xl font-bold text-neutral-text">
                                What do you want to learn?
                            </h1>
                            <p className="mt-1 text-sm text-neutral-muted">
                                Pilih tujuan belajarmu supaya rekomendasi kami lebih tepat sasaran.
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                {learningGoalOptions.map(({ id, label, icon: Icon }) => {
                                    const isSelected = learningGoal === id
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setLearningGoal(id)}
                                            className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
                                                isSelected
                                                    ? 'border-primary bg-blue-50'
                                                    : 'border-neutral-border hover:border-primary'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 text-primary" />
                                            <span className="font-medium text-neutral-text">{label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="rounded-xl border border-neutral-border px-5 py-3 font-medium text-neutral-text transition hover:bg-neutral-bg"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    disabled={!learningGoal}
                                    onClick={() => onFinish({ educationLevel, learningGoal })}
                                    className="flex-1 rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Continue →
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </main>
        </div>
    )
}