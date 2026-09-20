import { useState } from "react";
import Navbar from "../components/Navbar";
import TopHeader from "../components/TopHeader";
import { Save, LogOut } from "lucide-react";

const user = {
    track: "SMA",
    streak: 0,
    dailyGoal: 10,
    dailyProgress: 0,
    email: "guest@mathmentor.app",
};

const jenjangOptions = ["SD", "SMP", "SMA"];
const skillLevels = ["Pemula", "Menengah", "Lanjutan"];

export default function Settings() {
    const [dailyProblemsGoal, setDailyProblemsGoal] = useState(10);
    const [dailyMinutesGoal, setDailyMinutesGoal] = useState(15);
    const [jenjang, setJenjang] = useState(user.track);
    const [skillLevel, setSkillLevel] = useState("Pemula");
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex min-h-screen bg-neutral-bg font-sans text-neutral-text">
            <Navbar />

            <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 md:py-10 pb-28 md:pb-12 max-w-6xl mx-auto w-full">
                <TopHeader />

                <h1 className="font-heading text-xl md:text-2xl font-bold text-neutral-text">
                    Pengaturan
                </h1>
                <p className="text-xs text-neutral-muted mt-0.5">
                    Atur target harian dan tingkat kemampuanmu.
                </p>

                {/* FORM SECTION */}
                <section className="mt-6 rounded-2xl border border-neutral-border bg-neutral-card p-6 shadow-xs">
                    <label className="block text-sm font-semibold text-neutral-text">
                        Target soal harian
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={dailyProblemsGoal}
                        onChange={(event) => setDailyProblemsGoal(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-neutral-border bg-neutral-card px-4 py-2.5 text-sm text-neutral-text focus:border-primary focus:outline-none"
                    />

                    <label className="mt-5 block text-sm font-semibold text-neutral-text">
                        Target menit harian
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={dailyMinutesGoal}
                        onChange={(event) => setDailyMinutesGoal(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-neutral-border bg-neutral-card px-4 py-2.5 text-sm text-neutral-text focus:border-primary focus:outline-none"
                    />

                    <label className="mt-5 block text-sm font-semibold text-neutral-text">
                        Jenjang belajar
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {jenjangOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setJenjang(option)}
                                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${jenjang === option
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-neutral-border text-neutral-muted hover:border-primary/40"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <label className="mt-5 block text-sm font-semibold text-neutral-text">
                        Tingkat kemampuan
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {skillLevels.map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setSkillLevel(level)}
                                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${skillLevel === level
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-neutral-border text-neutral-muted hover:border-primary/40"
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 cursor-pointer"
                    >
                        <Save className="h-4 w-4" />
                        {saved ? "Tersimpan!" : "Simpan perubahan"}
                    </button>
                </section>

                {/* ACCOUNT SECTION */}
                <section className="mt-5 rounded-2xl border border-neutral-border bg-neutral-card p-6 shadow-xs">
                    <h3 className="font-heading text-base font-bold text-neutral-text">
                        Akun
                    </h3>
                    <p className="text-xs text-neutral-muted mt-0.5">{user.email}</p>

                    <button
                        type="button"
                        className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-border px-4 py-2.5 text-sm font-medium text-neutral-muted transition-colors hover:border-primary/40 cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar
                    </button>
                </section>
            </main>
        </div>
    );
}