import { useState } from 'react'
import Navbar from '../components/Navbar'
import {
    Target,
    Flame,
    GraduationCap,
    Save,
    LogOut,
} from 'lucide-react'

const user = {
    track: 'Kuliah',
    streak: 0,
    dailyGoal: 10,
    dailyProgress: 0,
    email: 'guest@mathmentor.app',
}

const skillLevels = ['Pemula', 'Menengah', 'Lanjutan']

export default function Settings() {
    const [dailyProblemsGoal, setDailyProblemsGoal] = useState(10)
    const [dailyMinutesGoal, setDailyMinutesGoal] = useState(15)
    const [skillLevel, setSkillLevel] = useState('Pemula')
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="flex min-h-screen bg-neutral-bg">
            <Navbar />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-[700px]">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {user.track}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                                <Flame className="h-3.5 w-3.5" />
                                {user.streak} hari beruntun
                            </span>
                        </div>

                        <div className="w-36">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Target className="h-3.5 w-3.5" />
                                    Target harian
                                </span>
                                <span>{user.dailyProgress}/{user.dailyGoal}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-blue-100">
                                <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${(user.dailyProgress / user.dailyGoal) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-[#17326b]">Pengaturan</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Atur target harian dan tingkat kemampuanmu.
                    </p>

                    <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-[#17326b]">
                            Target soal harian
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={dailyProblemsGoal}
                            onChange={(event) => setDailyProblemsGoal(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm text-[#17326b] focus:border-blue-300 focus:outline-none"
                        />

                        <label className="mt-5 block text-sm font-semibold text-[#17326b]">
                            Target menit harian
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={dailyMinutesGoal}
                            onChange={(event) => setDailyMinutesGoal(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-blue-100 px-4 py-2.5 text-sm text-[#17326b] focus:border-blue-300 focus:outline-none"
                        />

                        <label className="mt-5 block text-sm font-semibold text-[#17326b]">
                            Tingkat kemampuan
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {skillLevels.map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setSkillLevel(level)}
                                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${skillLevel === level
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <Save className="h-4 w-4" />
                            {saved ? 'Tersimpan!' : 'Simpan perubahan'}
                        </button>
                    </section>

                    <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#17326b]">Akun</h3>
                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>

                        <button
                            type="button"
                            className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                        >
                            <LogOut className="h-4 w-4" />
                            Keluar
                        </button>
                    </section>

                </div>
            </main>
        </div>
    )
}