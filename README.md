## Zordrax Analytica Frontend

Minimal Next.js 15 App Router console for triggering the existing FastAPI onboarding + infrastructure service. The UI offers two flows:

- **AI Deploy Architecture** (`/wizard`) → calls the AI-guided onboarding endpoint.
- **Manual Deploy** (`/manual`) → calls the manual deployment endpoint.

Both flows surface DevOps build IDs (when returned) and poll the backend until completion.

---

## Environment variables

| Name                     | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of the deployed FastAPI onboarding service (e.g. `https://zordrax-onboarding-agent...azurewebsites.net`). |

No other frontend env vars are used. The value is read at runtime and appended to every API request.

Create a `.env.local` file for local work:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-fastapi-instance.azurewebsites.net
```

---

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

- The landing page ( `/` ) shows the two primary actions.
- The **AI Deploy Architecture** card routes to `/wizard`.
- The **Manual Deploy** card routes to `/manual`.

Run a production build with `npm run build` and start it with `npm run start`.

---

## API integration

All requests are sent to `NEXT_PUBLIC_BACKEND_URL` with the following paths:

| Route     | HTTP method | Description                                 |
| --------- | ----------- | ------------------------------------------- |
| `/onboarding/ai-and-deploy` | POST | Trigger AI deploy flow (Wizard).          |
| `/onboarding/manual` | POST | Trigger manual deployment flow.          |
| `/devops/status/{run_id}`   | GET  | Poll build state when a `run_id` is returned. |

### Behavior

1. Clicking the deploy button sends the corresponding POST request.
2. Non-200 responses display a clear error with the HTTP status code.
3. Successful responses show the backend message, any DevOps link provided, and recommendations (Wizard and Manual both render JSON when supplied).
4. If a `run_id` (either top-level or inside `pipeline_run`) is returned, the page polls `/devops/status/{run_id}` every 20 seconds until the API reports `status: "completed"`.
5. Polling network failures show a warning but continue retrying on the next interval.

---

## Where to find the deploy buttons

- `/wizard` → “Deploy Architecture” button. Uses the AI/automation endpoint above.
- `/manual` → “Run Manual Deploy” button. Uses the manual endpoint.

Both pages share the same status blocks:

- **Deployment status**: info → success/error messaging plus optional DevOps link.
- **Build status**: live text such as “Build running…” / “Build succeeded”.
- **Recommendations**: read-only JSON when the backend supplies additional insights.

---

## Polling summary

- Poll interval: 20 seconds.
- Stops automatically when the backend returns `status: "completed"`.
- Displays `"Build succeeded"` when `result === "succeeded"`, otherwise surfaces the backend result.
- Network or parsing errors during polling raise a warning banner but do not interrupt the next scheduled attempt.

---

## Scripts

| Script         | Purpose                               |
| -------------- | ------------------------------------- |
| `npm run dev`  | Start local dev server on port 3000.  |
| `npm run build`| Production build (standalone output). |
| `npm start`    | Serve the built app on port 8080.     |
