import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";

// Import Pages
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import VerifyEmail from "../pages/Auth/VerifyEmail";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import GoogleAuthCallback from "../pages/Auth/GoogleAuthCallback";

import PersonalizationWizard from "../pages/Student/PersonalizationWizard";

import Topics from "../pages/Student/Topics/Topics";
import TopikDetail from "../pages/Student/ResultLearning/TopicDetailPage";

import PersonalizationProfile from "../pages/Student/Profile/PersonalizationProfile";
import EditProfile from "../pages/Student/Profile/EditProfile";

import QuestionPage from "../pages/Student/QuestionPage";
import QuestionReviewPage from "../pages/Student/QuestionReviewPage";

import Dashboard from "../pages/Student/Dashboard";
import Settings from "../pages/Settings";
import EvaluationPage from "../pages/Student/EvaluationPage";
import ResultPage from "../pages/Student/ResultPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/personalization" element={<PersonalizationWizard />} />

        <Route path="/" element={<Navigate to="/topik" replace />} />
        <Route path="/hasil-pembelajaran" element={<TopikDetail />} />
        <Route path="/topik" element={<Topics />} />
        <Route path="/profile" element={<PersonalizationProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/settings" element={<Settings />} />

        <Route path="/quiz" element={<QuestionPage />} />
        <Route path="/review-quiz" element={<QuestionReviewPage />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/evaluasi" element={<EvaluationPage />} />
        <Route path="/result" element={<ResultPage />} />
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
