import { useState } from "react";
import TeacherStudio from "./pages/TeacherStudio";
import StudentJourney from "./pages/StudentJourney";
import "katex/dist/katex.min.css";
import "./App.css";

export default function App() {
  const [surface, setSurface] = useState("teacher");

  return surface === "teacher" ? (
    <TeacherStudio onSwitchSurface={() => setSurface("student")} />
  ) : (
    <StudentJourney onSwitchSurface={() => setSurface("teacher")} />
  );
}
