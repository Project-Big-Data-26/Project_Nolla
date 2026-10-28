import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import RouteTracker from "./analytics/RouteTracker";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteTracker />
        <AppRoutes />
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
