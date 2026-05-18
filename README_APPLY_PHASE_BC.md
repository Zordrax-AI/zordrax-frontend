# Apply Phase B/C Execution UI

```powershell
cd C:\Users\Zordr\Desktop\zordrax-frontend

Remove-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack -Recurse -Force -ErrorAction SilentlyContinue

Expand-Archive `
  -Path C:\Users\Zordr\Downloads\zordrax_phase_bc_execution_pack.zip `
  -DestinationPath C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack `
  -Force

New-Item -ItemType Directory -Force .\lib
New-Item -ItemType Directory -Force .\app\execution
New-Item -ItemType Directory -Force .\app\execution\dependencies
New-Item -ItemType Directory -Force .\app\execution\queue
New-Item -ItemType Directory -Force .\app\execution\prs
New-Item -ItemType Directory -Force .\app\execution\pipelines
New-Item -ItemType Directory -Force .\app\swarm
New-Item -ItemType Directory -Force .\app\swarm\sandboxes
New-Item -ItemType Directory -Force .\app\swarm\remediation
New-Item -ItemType Directory -Force .\app\swarm\confidence
New-Item -ItemType Directory -Force .\app\swarm\merge

Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\lib\zordrax-execution-store.ts .\lib\zordrax-execution-store.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\execution\page.tsx .\app\execution\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\execution\dependencies\page.tsx .\app\execution\dependencies\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\execution\queue\page.tsx .\app\execution\queue\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\execution\prs\page.tsx .\app\execution\prs\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\execution\pipelines\page.tsx .\app\execution\pipelines\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\swarm\page.tsx .\app\swarm\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\swarm\sandboxes\page.tsx .\app\swarm\sandboxes\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\swarm\remediation\page.tsx .\app\swarm\remediation\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\swarm\confidence\page.tsx .\app\swarm\confidence\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_phase_bc_execution_pack\frontend-repo\app\swarm\merge\page.tsx .\app\swarm\merge\page.tsx -Force
```

Optional nav update:

```powershell
if (Test-Path ".\app\zordrax-nav.tsx") {
  $navPath = ".\app\zordrax-nav.tsx"
  $nav = Get-Content $navPath -Raw
  if ($nav -notmatch 'href:\s*"/execution"') {
    $target = '{ href: "/platform", label: "Platform" },'
    $replacement = $target + "`r`n  { href: `"/execution`", label: `"Execution`" },`r`n  { href: `"/swarm`", label: `"Swarm`" },"
    $nav = $nav.Replace($target, $replacement)
    Set-Content $navPath $nav
  }
}
```

Build/push:

```powershell
npm run build
git status --short
git add .
git commit -m "Add Phase B and C execution control pages"
git push github main
git push origin main
```
