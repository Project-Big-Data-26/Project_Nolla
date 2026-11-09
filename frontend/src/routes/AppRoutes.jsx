import React, { lazy, Suspense } from "react";
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
import PackagesPage from "../pages/Landing/PackagesPage";
import LegalInfoPage from "../pages/Landing/LegalInfoPage";
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
import ComplaintPage from "../pages/Student/ComplaintPage";

import QuestionPage from "../pages/Student/QuestionPage";
import QuestionReviewPage from "../pages/Student/QuestionReviewPage";

import Settings from "../pages/Student/Settings"; // Ditambahkan kembali Settings
import PaymentReturn from "../pages/Student/PaymentReturn";

// Flag build (FE-09): pintu cek soal staging hanya ikut di-build bila
// VITE_ENABLE_STAGING_CHECK=true. Nilai diganti Vite saat build, sehingga bila false
// import di bawah terbuang dan kode halaman staging tidak masuk bundle production.
const STAGING_CHECK_ENABLED = import.meta.env.VITE_ENABLE_STAGING_CHECK === "true";

const StagingCheckRoute = STAGING_CHECK_ENABLED
  ? lazy(() =>
      import("../pages/Staging/StagingSoalBrowser").then((module) => ({
        default: module.StagingCheckRoute,
      })),
    )
  : null;
const StagingQuestionReviewPage = STAGING_CHECK_ENABLED
  ? lazy(() => import("../pages/Staging/StagingQuestionReviewPage"))
  : null;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public landing page at the site root. Keep /nolla as a legacy alias. */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/paket" element={<PackagesPage />} />
      <Route path="/nolla" element={<Navigate to="/" replace />} />
      <Route path="/terms-and-conditions" element={<LegalInfoPage documentType="terms" />} />
      <Route path="/privacy-policy" element={<LegalInfoPage documentType="privacy" />} />
      <Route path="/pengaduan" element={<ComplaintPage />} />

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

      {/* Pintu cek soal (FE-09): tanpa login; hanya ada bila build memakai
          VITE_ENABLE_STAGING_CHECK=true, dan data hanya ada bila backend APP_ENV=staging. */}
      {STAGING_CHECK_ENABLED && (
        <>
          <Route
            path="/staging/cek-soal"
            element={
              <Suspense fallback={null}>
                <StagingCheckRoute />
              </Suspense>
            }
          />
          <Route
            path="/staging/cek-soal/review"
            element={
              <Suspense fallback={null}>
                <StagingQuestionReviewPage />
              </Suspense>
            }
          />
        </>
      )}

      {/* ========================================
          PROTECTED STUDENT ROUTES
      ======================================== */}

      <Route element={<ProtectedRoute />}>
        <Route path="/payment/return" element={<PaymentReturn />} />
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
