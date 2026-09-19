import { useState } from "react";
import PersonalizationWizard from "./pages/PersonalizationWizard";
import Dashboard from "./pages/Dashboard";

function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (!onboardingDone) {
    return <PersonalizationWizard onFinish={() => setOnboardingDone(true)} />;
  }

  return <Dashboard />;
}

export default App;