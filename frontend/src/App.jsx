<<<<<<< HEAD
import PdfQuestionAnalyzer from "./pages/PdfQuestionAnalyzer";
import "katex/dist/katex.min.css";
import "./App.css";

export default function App() {
  return <PdfQuestionAnalyzer />;
}
=======
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
>>>>>>> integrasi-login-fix
