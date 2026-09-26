import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfQuestionAnalyzer from "./pages/PdfQuestionAnalyzer";
import ChangePassword from "./pages/ChangePassword";
import "katex/dist/katex.min.css";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PdfQuestionAnalyzer />} />
        <Route path="/ganti-password" element={<ChangePassword />} />
      </Routes>
    </BrowserRouter>
  );
}