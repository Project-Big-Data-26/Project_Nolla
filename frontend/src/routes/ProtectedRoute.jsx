import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const auth = useAuth();

  // BACAKAN JUGA DARI LOCALSTORAGE SEBAGAI SECONDARY CHECK
  const hasAccessToken = localStorage.getItem("accessToken");

  // Jika token di LocalStorage TIDAK ADA ATAU auth context menyatakan belum login:
  if (!hasAccessToken || !auth?.isAuthenticated) {
    // Tendang paksa ke login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
