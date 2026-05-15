# Apply Task Intake Queue Frontend

```powershell
cd C:\Users\Zordr\Desktop\frontend-repo

Copy-Item C:\Users\Zordr\Desktop\zordrax_task_intake_queue_pack\frontend-repo\lib\zordrax-task-intake-store.ts .\lib\zordrax-task-intake-store.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_task_intake_queue_pack\frontend-repo\app\orchestrator\task-intake-panel.tsx .\app\orchestrator\task-intake-panel.tsx -Force
New-Item -ItemType Directory -Force .\app\tasks
Copy-Item C:\Users\Zordr\Desktop\zordrax_task_intake_queue_pack\frontend-repo\app\tasks\page.tsx .\app\tasks\page.tsx -Force
```

Wire into `app/orchestrator/orchestrator-cockpit.tsx`:

```tsx
import TaskIntakePanel from "./task-intake-panel";
```

Add JSX near the top:

```tsx
<TaskIntakePanel defaultTask={prompt} />
```

Build/push:

```powershell
npm run build
git add .
git commit -m "Add AI task intake holding queue"
git push origin main
git push github main
```
