# Zordrax Frontend AI Patch -> Real PR Pack

Build location:

```text
frontend-repo
```

This adds browser controls for:

```text
Generate AI Patch
Validate policy
Create Real PR
Show PR link
```

## Files included

```text
lib/zordrax-orchestrator-client.ts
app/orchestrator/ai-patch-panel.tsx
app/orchestrator/orchestrator-cockpit-ai-patch-integration-snippet.tsx
```

## Apply to active repo layout

Your active Vercel route has been:

```text
src/app/(dashboard)/orchestrator/
src/lib/
```

Copy:

```powershell
cd C:\Users\Zordr\Desktop\frontend-repo

Copy-Item `
  C:\Users\Zordr\Desktop\zordrax_frontend_ai_patch_to_pr_pack\lib\zordrax-orchestrator-client.ts `
  .\src\lib\zordrax-orchestrator-client.ts `
  -Force

Copy-Item `
  C:\Users\Zordr\Desktop\zordrax_frontend_ai_patch_to_pr_pack\app\orchestrator\ai-patch-panel.tsx `
  ".\src\app\(dashboard)\orchestrator\ai-patch-panel.tsx" `
  -Force
```

## Update orchestrator-cockpit.tsx

In:

```text
src/app/(dashboard)/orchestrator/orchestrator-cockpit.tsx
```

Add import near the top:

```tsx
import AIPatchPanel from "./ai-patch-panel";
```

Then add this section somewhere below PR Links or near the lower panels:

```tsx
<AIPatchPanel
  runId={runId || ""}
  defaultGoal={prompt}
  defaultRepo="onboarding-repo"
/>
```

## Test

```powershell
npm run build
npm run dev
```

Open:

```text
http://localhost:3000/orchestrator
```

## Deploy

```powershell
git add .
git commit -m "Add cockpit AI patch to PR controls"
git pull --rebase origin main
git push origin main
```

If Vercel deploys from GitHub:

```powershell
git push github main
```
