import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import RouteTracker from "./analytics/RouteTracker";
import StudentGuideController from "./components/StudentGuideController";
import { StudentGuideProvider } from "./context/StudentGuideProvider";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <StudentGuideProvider>
          <RouteTracker />
          <AppRoutes />
          <StudentGuideController />
          <Toaster position="top-center" richColors closeButton />
        </StudentGuideProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
