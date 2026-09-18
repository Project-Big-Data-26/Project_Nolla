import React from "react";
import {
  Flame,
  Trophy,
  Target,
  Clock,
  Play,
  CheckCircle2,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const topics = [
    {
      name: "Pecahan & Persentase",
      progress: 40,
      color: "bg-primary",
    },
    {
      name: "Operasi Bilangan",
      progress: 20,
      color: "bg-purple-500",
    },
    {
      name: "Geometri Dasar",
      progress: 65,
      color: "bg-green-500",
    },
  ];

  const activities = [
    {
      title: "Menyelesaikan kuis Pecahan",
      time: "Hari ini, 10:24",
    },
    {
      title: "Memulai materi Geometri Dasar",
      time: "Kemarin, 20:15",
    },
    {
      title: "Menyelesaikan Operasi Bilangan",
      time: "Kemarin, 15:40",
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Navbar / Sidebar */}
      <Navbar />

      {/* Konten Utama */}
      <main className="flex-1 p-5 md:p-8 pb-24 md:pb-8">
        {/* HEADER */}
        <header className="mb-7">
          <p className="text-sm text-neutral-muted mb-1">
            Jumat, 18 September 2026
          </p>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-neutral-text">
            Selamat Datang, Rifqi! 👋
          </h1>

          <p className="text-neutral-muted mt-2">
            Berikut adalah ringkasan aktivitas pembelajaran kamu hari ini.
          </p>
        </header>

        {/* STATISTIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Streak */}
          <div className="bg-neutral-card rounded-2xl p-5 border border-neutral-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-muted">
                  Streak Belajar
                </p>

                <p className="text-2xl font-bold text-neutral-text mt-1">
                  7 Hari
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                <Flame className="text-orange-500" size={22} />
              </div>
            </div>
          </div>

          {/* Poin */}
          <div className="bg-neutral-card rounded-2xl p-5 border border-neutral-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-muted">
                  Total Poin
                </p>

                <p className="text-2xl font-bold text-neutral-text mt-1">
                  1.240
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Trophy className="text-yellow-500" size={22} />
              </div>
            </div>
          </div>

          {/* Akurasi */}
          <div className="bg-neutral-card rounded-2xl p-5 border border-neutral-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-muted">
                  Akurasi
                </p>

                <p className="text-2xl font-bold text-neutral-text mt-1">
                  86%
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                <Target className="text-green-500" size={22} />
              </div>
            </div>
          </div>

          {/* Waktu Belajar */}
          <div className="bg-neutral-card rounded-2xl p-5 border border-neutral-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-muted">
                  Waktu Belajar
                </p>

                <p className="text-2xl font-bold text-neutral-text mt-1">
                  12,5 jam
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="text-blue-500" size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* LANJUTKAN BELAJAR */}
        <section className="bg-primary rounded-3xl p-6 text-white mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex-1">
              <p className="text-white/70 text-sm mb-2">
                LANJUTKAN BELAJAR
              </p>

              <h2 className="text-2xl font-bold">
                Pecahan & Persentase
              </h2>

              <p className="text-white/70 mt-2">
                Lanjutkan dari materi terakhir yang kamu pelajari.
              </p>

              <div className="mt-5 max-w-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>40%</span>
                </div>

                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[40%] bg-white rounded-full" />
                </div>
              </div>
            </div>

            <button className="bg-white text-primary px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-bg transition">
              <Play size={18} />
              Lanjutkan
            </button>
          </div>
        </section>

        {/* TARGET + MATERI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* TARGET HARI INI */}
          <section className="bg-neutral-card rounded-2xl p-6 border border-neutral-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-text">
                  Target Hari Ini
                </h2>

                <p className="text-sm text-neutral-muted mt-1">
                  Target belajar yang perlu kamu selesaikan
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target size={22} className="text-blue-600" />
              </div>
            </div>

            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-bold text-neutral-text">
                  3
                  <span className="text-lg text-neutral-muted font-medium">
                    /5
                  </span>
                </p>

                <p className="text-sm text-neutral-muted mt-1">
                  aktivitas selesai
                </p>
              </div>

              <span className="text-sm font-semibold text-primary">
                60%
              </span>
            </div>

            <div className="h-3 bg-neutral-bg rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-primary rounded-full" />
            </div>

            <p className="text-xs text-neutral-muted mt-3">
              Tinggal 2 aktivitas lagi untuk mencapai target hari ini.
            </p>
          </section>

          {/* MATERI */}
          <section className="bg-neutral-card rounded-2xl p-6 border border-neutral-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-text">
                  Materi yang Sedang Dipelajari
                </h2>

                <p className="text-sm text-neutral-muted mt-1">
                  Lanjutkan materi yang belum selesai
                </p>
              </div>

              <BookOpen size={20} className="text-neutral-muted" />
            </div>

            <div className="space-y-5">
              {topics.map((topic) => (
                <div key={topic.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-text">
                      {topic.name}
                    </span>

                    <span className="text-sm text-neutral-muted">
                      {topic.progress}%
                    </span>
                  </div>

                  <div className="h-2 bg-neutral-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full ${topic.color} rounded-full`}
                      style={{
                        width: `${topic.progress}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* AKTIVITAS TERBARU */}
        <section className="bg-neutral-card rounded-2xl p-6 border border-neutral-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-neutral-text">
                Aktivitas Terbaru
              </h2>

              <p className="text-sm text-neutral-muted mt-1">
                Aktivitas belajarmu terbaru
              </p>
            </div>

            <Clock size={20} className="text-neutral-muted" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-neutral-bg"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-text">
                    {activity.title}
                  </p>

                  <p className="text-xs text-neutral-muted mt-1">
                    {activity.time}
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  className="text-neutral-muted mt-1"
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;