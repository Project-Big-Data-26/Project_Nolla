import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GuestRoute = () => {
  const auth = useAuth();

  if (auth?.isAuthenticated) {
    return <Navigate to="/topik" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;