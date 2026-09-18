import Navbar from '../components/Navbar'
import {
    Target,
    TrendingUp,
    Flame,
    Trophy,
    Award,
    ChevronRight,
    BookOpen,
} from 'lucide-react'

const user = {
    name: 'Pelajar Tamu',
    email: 'guest@mathmentor.app',
    level: 'Pemula',
    track: 'Umum',
}

const stats = [
    { label: 'Akurasi keseluruhan', value: '0%', icon: TrendingUp, tint: 'text-emerald-600 bg-emerald-50' },
    { label: 'Soal terselesaikan', value: '0', icon: Target, tint: 'text-blue-600 bg-blue-50' },
    { label: 'Rentetan belajar', value: '0 hari', icon: Flame, tint: 'text-orange-500 bg-orange-50' },
    { label: 'Poin diperoleh', value: '0', icon: Trophy, tint: 'text-amber-500 bg-amber-50' },
]

const recommendations = [
    { title: 'Pecahan & Persentase', category: 'Aritmatika · Pemula', progress: 0 },
    { title: 'Operasi Bilangan', category: 'Aritmatika · Pemula', progress: 0 },
    { title: 'Aljabar Dasar', category: 'Aljabar · Pemula', progress: 0 },
]

const badges = [
    { title: 'Pemecah Masalah', description: 'Menyelesaikan 10 soal' },
]

export default function PersonalizationProfile() {
    return (
        <div className="flex min-h-screen bg-neutral-bg">
            <Navbar />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-[860px]">

                    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                                🎓 Pelajar {user.track}
                            </span>
                            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                                🔥 0 hari beruntun 🔥
                            </span>
                        </div>

                        <div className="w-36">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Target className="h-3.5 w-3.5" />
                                    Target harian
                                </span>
                                <span>0/10</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-blue-100">
                                <div className="h-full w-0 rounded-full bg-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#17326b]">{user.name}</h2>
                            <p className="text-sm text-slate-500">{user.email}</p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                                🎓 {user.level} · {user.track}
                            </span>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {stats.map(({ label, value, icon: Icon, tint }) => (
                            <div key={label} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold leading-tight text-[#17326b]">{value}</p>
                                    <p className="text-[11px] text-slate-500">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className="mb-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="text-blue-600"><BookOpen className="h-4 w-4" /></span>
                            <h3 className="text-sm font-semibold text-[#17326b]">Rekomendasi untukmu</h3>
                        </div>

                        <div className="space-y-2.5">
                            {recommendations.map(({ title, category, progress }) => (
                                <button
                                    key={title}
                                    type="button"
                                    className="flex w-full items-center gap-4 rounded-xl border border-blue-100 px-4 py-3 text-left transition hover:border-blue-300"
                                >
                                    <div className="relative h-10 w-10 shrink-0">
                                        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="#dbeafe" strokeWidth="3" />
                                            <circle
                                                cx="18" cy="18" r="16" fill="none"
                                                stroke="#2563eb" strokeWidth="3"
                                                strokeDasharray={`${progress}, 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#17326b]">
                                            {progress}%
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-[#17326b]">{title}</p>
                                        <p className="text-[11px] text-slate-500">{category}</p>
                                    </div>

                                    <span className="shrink-0 text-slate-400">
                                        <ChevronRight className="h-4 w-4" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="text-blue-600"><Award className="h-4 w-4" /></span>
                            <h3 className="text-sm font-semibold text-[#17326b]">Lencana diperoleh</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {badges.map(({ title, description }) => (
                                <div
                                    key={title}
                                    className="flex flex-col items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-5 text-center"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-[#17326b]">{title}</p>
                                    <p className="text-xs text-slate-500">{description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>
        </div>
    )
}