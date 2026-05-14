/*
Add this import near the top of your active cockpit file:

import AIPatchPanel from "./ai-patch-panel";

Then add this JSX somewhere inside the main page, usually after PR Links:

<AIPatchPanel
  runId={runId || ""}
  defaultGoal={prompt}
  defaultRepo="onboarding-repo"
/>

Active file in your repo has usually been:

src/app/(dashboard)/orchestrator/orchestrator-cockpit.tsx
*/
