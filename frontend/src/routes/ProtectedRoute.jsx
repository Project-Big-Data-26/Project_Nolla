import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const auth = useAuth();

  const hasAccessToken =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  if (!hasAccessToken || !auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
