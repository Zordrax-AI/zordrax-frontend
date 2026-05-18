# Apply Sequence Navigation Pack

Run in PowerShell:

```powershell
cd C:\Users\Zordr\Desktop\zordrax-frontend

Remove-Item C:\Users\Zordr\Desktop\zordrax_sequence_navigation_pack -Recurse -Force -ErrorAction SilentlyContinue

Expand-Archive `
  -Path C:\Users\Zordr\Downloads\zordrax_sequence_navigation_pack.zip `
  -DestinationPath C:\Users\Zordr\Desktop\zordrax_sequence_navigation_pack `
  -Force

New-Item -ItemType Directory -Force .\app\workflow
New-Item -ItemType Directory -Force .\app\workflow\run-through
New-Item -ItemType Directory -Force .\app\orchestrator

Copy-Item C:\Users\Zordr\Desktop\zordrax_sequence_navigation_pack\frontend-repo\app\zordrax-nav.tsx .\app\zordrax-nav.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_sequence_navigation_pack\frontend-repo\app\workflow\page.tsx .\app\workflow\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_sequence_navigation_pack\frontend-repo\app\workflow\run-through\page.tsx .\app\workflow\run-through\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_sequence_navigation_pack\frontend-repo\app\orchestrator\workflow-sequence-panel.tsx .\app\orchestrator\workflow-sequence-panel.tsx -Force
```

Optional: add this inside `app/orchestrator/orchestrator-cockpit.tsx` near the top of the page:

```tsx
import WorkflowSequencePanel from "./workflow-sequence-panel";
```

Then render:

```tsx
<WorkflowSequencePanel />
```

Build and push:

```powershell
npm run build

git status --short
git add .
git commit -m "Add sequenced workflow navigation"
git push github main
git push origin main
```

Open:

```text
/workflow
/workflow/run-through
```
