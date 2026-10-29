import React from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // Ditambahkan Navigate
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";

// Import Pages
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import VerifyEmail from "../pages/Auth/VerifyEmail";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import LandingPage from "../pages/Landing/LandingPage";
import GoogleAuthCallback from "../pages/Auth/GoogleAuthCallback";

// ========================================
// STUDENT PAGES
// ========================================

import PersonalizationWizard from "../pages/Student/PersonalizationWizard";

import Topics from "../pages/Student/Topics/Topics";
import TopikDetail from "../pages/Student/ResultLearning/TopicDetailPage";

import PersonalizationProfile from "../pages/Student/Profile/PersonalizationProfile";
import EditProfile from "../pages/Student/Profile/EditProfile";
import ChangePassword from "../pages/Student/Profile/ChangePassword";

import QuestionPage from "../pages/Student/QuestionPage";
import QuestionReviewPage from "../pages/Student/QuestionReviewPage";

import Settings from "../pages/Student/Settings"; // Ditambahkan kembali Settings

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public landing page at the site root. Keep /nolla as a legacy alias. */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/nolla" element={<Navigate to="/" replace />} />

      {/* ========================================
          AUTH ROUTES
      ======================================== */}

      {/* Logika GuestRoute milik Roma (PENTING: Mencegah user login masuk ke sini) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />

      {/* Jangan dimasukkan ke ProtectedRoute: user belum login saat callback tiba. */}
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

      {/* ========================================
          PROTECTED STUDENT ROUTES
      ======================================== */}

      <Route element={<ProtectedRoute />}>
        <Route path="/personalization" element={<PersonalizationWizard />} />
        <Route path="/hasil-pembelajaran" element={<TopikDetail />} />
        <Route path="/topik" element={<Topics />} />
        <Route path="/profile" element={<PersonalizationProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/ganti-password" element={<ChangePassword />} />
        <Route path="/quiz" element={<QuestionPage />} />
        <Route path="/review-quiz" element={<QuestionReviewPage />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Single Fallback 404 */}
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
