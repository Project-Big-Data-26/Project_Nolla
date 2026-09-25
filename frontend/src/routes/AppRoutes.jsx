import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import Pages
import Dashboard from "../pages/Dashboard";
import QuestionPage from "../pages/QuestionPage";
import PersonalizationProfile from "../pages/PersonalizationProfile";
import Topics from "../pages/Topics";
import TopicDetailPage from "../pages/TopicDetailPage";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Settings from "../pages/Settings";
import PersonalizationWizard from "../pages/PersonalizationWizard";
import EvaluationPage from "../pages/EvaluationPage";
import ResultPage from "../pages/ResultPage";
import VerifyEmail from "../pages/Auth/VerifyEmail";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect Halaman Utama ke Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Main App Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/quiz" element={<QuestionPage />} />
      <Route path="/profile" element={<PersonalizationProfile />} />
      <Route path="/topik" element={<Topics />} />
      <Route path="/topik/detail" element={<TopicDetailPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/personalization" element={<PersonalizationWizard />} />
      <Route path="/evaluasi" element={<EvaluationPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />

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
