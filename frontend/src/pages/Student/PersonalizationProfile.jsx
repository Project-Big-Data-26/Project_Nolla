import React from "react";
import Navbar from "../../components/Navbar";
import TopHeader from "../../components/TopHeader";
import SectionCard from "../../components/SectionCard";
import {
  Target,
  TrendingUp,
  Flame,
  Trophy,
  Award,
  ChevronRight,
  BookOpen,
} from "lucide-react";

const user = {
  name: "Pelajar Tamu",
  email: "guest@mathmentor.app",
  level: "Pemula",
  track: "Umum",
  streak: 0,
  dailyGoal: 10,
  dailyProgress: 0,
};

const stats = [
  {
    label: "Akurasi keseluruhan",
    value: "0%",
    icon: TrendingUp,
    tint: "text-success bg-success/10",
  },
  {
    label: "Soal terselesaikan",
    value: "0",
    icon: Target,
    tint: "text-primary bg-primary/10",
  },
  {
    label: "Rentetan belajar",
    value: "0 hari",
    icon: Flame,
    tint: "text-secondary bg-secondary/10",
  },
  {
    label: "Poin diperoleh",
    value: "0",
    icon: Trophy,
    tint: "text-secondary-hover bg-secondary/10",
  },
];

const recommendations = [
  {
    title: "Pecahan & Persentase",
    category: "Aritmatika · Pemula",
    progress: 0,
  },
  { title: "Operasi Bilangan", category: "Aritmatika · Pemula", progress: 0 },
  { title: "Aljabar Dasar", category: "Aljabar · Pemula", progress: 0 },
];

const badges = [
  { title: "Pemecah Masalah", description: "Menyelesaikan 10 soal" },
];

export default function PersonalizationProfile() {
  return (
    <div className="flex min-h-screen bg-neutral-bg font-sans text-neutral-text">
      <Navbar />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 md:py-10 pb-28 md:pb-12 max-w-6xl mx-auto w-full">
        <TopHeader
          track={user.track}
          streak={user.streak}
          dailyProgress={user.dailyProgress}
          dailyGoal={user.dailyGoal}
        />

        {/* USER PROFILE HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-neutral-text">
              {user.name}
            </h2>
            <p className="text-xs text-neutral-muted mt-0.5">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              🎓 {user.level} · {user.track}
            </span>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tint }) => (
            <SectionCard key={label} className="flex items-center gap-3.5 p-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight text-neutral-text">
                  {value}
                </p>
                <p className="text-xs font-medium text-neutral-muted mt-0.5">
                  {label}
                </p>
              </div>
            </SectionCard>
          ))}
        </div>

        {/* RECOMMENDATIONS SECTION */}
        <SectionCard as="section" className="mb-8">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-base font-bold text-neutral-text">
              Rekomendasi untukmu
            </h3>
          </div>

          <div className="space-y-3">
            {recommendations.map(({ title, category, progress }) => (
              <button
                key={title}
                type="button"
                className="flex w-full items-center gap-4 rounded-xl border border-neutral-border bg-neutral-card p-4 text-left transition-colors hover:border-primary/40 cursor-pointer"
              >
                <div className="relative h-10 w-10 shrink-0">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="var(--color-neutral-border)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                      strokeDasharray={`${progress}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-text">
                    {progress}%
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-text">
                    {title}
                  </p>
                  <p className="text-xs text-neutral-muted mt-0.5">
                    {category}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-muted" />
              </button>
            ))}
          </div>
        </SectionCard>

        {/* BADGES SECTION */}
        <SectionCard as="section">
          <div className="mb-5 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-base font-bold text-neutral-text">
              Lencana diperoleh
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {badges.map(({ title, description }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-5 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary-hover">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-neutral-text">
                  {title}
                </p>
                <p className="text-xs text-neutral-muted">{description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </main>
    </div>
  );
}
