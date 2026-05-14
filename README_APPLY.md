# Zordrax Frontend Live Polling + PR Links Pack

Build location:

```text
frontend-repo
```

This pack upgrades `/orchestrator` with:

```text
- live run-status polling
- clickable PR links
- validation/PR status badges
- better status panel
```

## Files included

```text
lib/zordrax-orchestrator-client.ts
app/orchestrator/orchestrator-cockpit.tsx
```

## Important

Your repo previously used root folders:

```text
app/
lib/
```

So copy there first.

If your active app is actually `src/app`, copy to `src/app` and `src/lib` instead.

## Apply from frontend-repo

```powershell
Copy-Item C:\Users\Zordr\Desktop\zordrax_frontend_live_polling_pr_links_pack\lib\zordrax-orchestrator-client.ts .\lib\zordrax-orchestrator-client.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_frontend_live_polling_pr_links_pack\app\orchestrator\orchestrator-cockpit.tsx .\app\orchestrator\orchestrator-cockpit.tsx -Force
```

If using `src` layout:

```powershell
Copy-Item C:\Users\Zordr\Desktop\zordrax_frontend_live_polling_pr_links_pack\lib\zordrax-orchestrator-client.ts .\src\lib\zordrax-orchestrator-client.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_frontend_live_polling_pr_links_pack\app\orchestrator\orchestrator-cockpit.tsx .\src\app\orchestrator\orchestrator-cockpit.tsx -Force
```

## Check `page.tsx`

Your page should import the cockpit:

```tsx
import OrchestratorCockpit from "./orchestrator-cockpit";

export default function Page() {
  return <OrchestratorCockpit />;
}
```

## Env var

Vercel needs:

```text
NEXT_PUBLIC_ONBOARDING_API_BASE=https://zordrax-onboarding-agent.greenground-d9556cdb.uksouth.azurecontainerapps.io
```

## Test locally

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
git commit -m "Add live orchestrator polling and PR links"
git push origin main
```

If Vercel deploys from GitHub, also push to your GitHub remote.
