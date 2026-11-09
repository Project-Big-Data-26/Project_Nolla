import { useMemo, useState } from "react";
import { StudentGuideContext } from "./StudentGuideContext";

export function StudentGuideProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoChapterStage, setDemoChapterStage] = useState("pretest");

  const value = useMemo(
    () => ({ isDemoMode, setIsDemoMode, demoChapterStage, setDemoChapterStage }),
    [isDemoMode, demoChapterStage],
  );

  return (
    <StudentGuideContext.Provider value={value}>
      {children}
    </StudentGuideContext.Provider>
  );
}
