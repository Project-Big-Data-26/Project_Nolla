import { useState } from "react";
import PersonalizationWizard from "./pages/PersonalizationWizard";
import PersonalizationProfile from "./pages/PersonalizationProfile";

function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (!onboardingDone) {
    return <PersonalizationWizard onFinish={() => setOnboardingDone(true)} />;
  }

  return <PersonalizationProfile />;
}

export default App;