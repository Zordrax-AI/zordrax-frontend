# Apply Frontend Next Wave

Copy files into `frontend-repo`.

This gives you:
- live polling helper
- PR link rendering helper
- updated client functions

Files:

```text
lib/zordrax-orchestrator-client.next-wave.ts
app/orchestrator/live-polling-snippet.tsx
```

Use these to update your existing cockpit. Do not blindly replace if your repo uses `src/`.
If your app is in root `app/`, copy to root.
If your app is in `src/app`, copy to `src/`.
