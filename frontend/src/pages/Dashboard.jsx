import React from "react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Sidebar di sisi kiri */}
      <Navbar />

      {/* Area Konten Utama */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="font-heading text-lms-2xl font-bold text-neutral-text">
            Selamat Datang, Rifqi! 👋
          </h1>
          <p className="text-lms-base text-neutral-muted">
            Berikut adalah ringkasan aktivitas pembelajaran kamu hari ini.
          </p>
        </header>
      </main>
    </div>
  );
};

export default Dashboard;
