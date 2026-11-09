import { createContext, useContext } from "react";

const defaultGuideState = {
  isDemoMode: false,
  setIsDemoMode: () => {},
  demoChapterStage: "pretest",
  setDemoChapterStage: () => {},
};

export const StudentGuideContext = createContext(defaultGuideState);
export const useStudentGuide = () => useContext(StudentGuideContext);
