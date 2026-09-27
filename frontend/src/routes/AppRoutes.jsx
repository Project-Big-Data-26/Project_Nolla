import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import Pages
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import VerifyEmail from "../pages/Auth/VerifyEmail";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

import PersonalizationWizard from "../pages/Student/PersonalizationWizard";

import Topics from "../pages/Student/Topics/Topics";
import TopikDetail from "../pages/Student/ResultLearning/TopicDetailPage";

import QuestionPage from "../pages/Student/QuestionPage";
import QuestionReviewPage from "../pages/Student/QuestionReviewPage";

import Dashboard from "../pages/Student/Dashboard";
import PersonalizationProfile from "../pages/Student/PersonalizationProfile";
import Settings from "../pages/Student/Settings";
import EvaluationPage from "../pages/Student/EvaluationPage";
import ResultPage from "../pages/Student/ResultPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/*Auth Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />

      {/*Personalization Route */}
      <Route path="/personalization" element={<PersonalizationWizard />} />

      {/*Dashboard Student Role */}
      <Route path="/" element={<Navigate to="/topik" replace />} />
      <Route path="/hasil-pembelajaran" element={<TopikDetail />} />
      <Route path="/topik" element={<Topics />} />
      <Route path="/profile" element={<PersonalizationProfile />} />

      <Route path="/quiz" element={<QuestionPage />} />
      <Route path="/review-quiz" element={<QuestionReviewPage />} />

      {/*Route gk kepake */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/evaluasi" element={<EvaluationPage />} />
      <Route path="/result" element={<ResultPage />} />

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
