import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import Pages
import Dashboard from "../pages/Dashboard";
import QuestionPage from "../pages/QuestionPage";
// Uncomment halaman lain jika sudah dibuat:
// import Auth from '../pages/Auth'
// import OnboardingWizard from '../pages/OnboardingWizard'
// import Profile from '../pages/Profile'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect Halaman Utama ke Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Main App Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/quiz" element={<QuestionPage />} />

      {/* Rencana Route Tambahan */}
      {/* <Route path="/auth" element={<Auth />} /> */}
      {/* <Route path="/onboarding" element={<OnboardingWizard />} /> */}
      {/* <Route path="/profile" element={<Profile />} /> */}

      {/* Fallback 404 / Route Tidak Ditemukan */}
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center bg-neutral-bg">
            <h1 className="text-xl font-bold text-slate-700">
              404 | Halaman Tidak Ditemukan
            </h1>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
