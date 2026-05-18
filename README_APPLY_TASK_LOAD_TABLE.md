# Apply

```powershell
cd C:\Users\Zordr\Desktop\frontend-repo
npm install xlsx

Copy-Item C:\Users\Zordr\Desktop\zordrax_task_load_table_pack\frontend-repo\lib\zordrax-task-table-store.ts .\lib\zordrax-task-table-store.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_task_load_table_pack\frontend-repo\app\orchestrator\task-load-table-panel.tsx .\app\orchestrator\task-load-table-panel.tsx -Force
New-Item -ItemType Directory -Force .\app\tasks
Copy-Item C:\Users\Zordr\Desktop\zordrax_task_load_table_pack\frontend-repo\app\tasks\page.tsx .\app\tasks\page.tsx -Force
```

Optional cockpit wire:

```tsx
import TaskLoadTablePanel from "./task-load-table-panel";
<TaskLoadTablePanel defaultTask={prompt} />
```

Then:

```powershell
npm run build
git add .
git commit -m "Add spreadsheet task loader"
git push origin main
git push github main
```
