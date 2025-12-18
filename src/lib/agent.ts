// src/lib/agent.ts
const BASE =
  (process.env.NEXT_PUBLIC_AGENT_BASE_URL ?? "").replace(/\/$/, "");

if (!BASE) {
  throw new Error("NEXT_PUBLIC_AGENT_BASE_URL is missing");
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status}: ${t}`);
  }
  return res.json();
}

/* ---------------- RUNS ---------------- */

export async function onboard(payload: any) {
  const res = await fetch(`${BASE}/api/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return json<{ run_id: string }>(res);
}

export async function listRuns() {
  const res = await fetch(`${BASE}/api/runs`);
  return json<{ items: any[] }>(res);
}

export function eventsUrl(runId: string) {
  return `${BASE}/api/runs/${runId}/events`;
}

/* ---------------- ONBOARDING ---------------- */

export async function createSession() {
  const res = await fetch(`${BASE}/api/onboarding/sessions`, {
    method: "POST",
  });
  return json<{ session_id: string }>(res);
}

export async function nextQuestion(sessionId: string) {
  const res = await fetch(
    `${BASE}/api/onboarding/sessions/${sessionId}/next-question`
  );
  return json<any>(res);
}

export async function answerQuestion(
  sessionId: string,
  key: string,
  value: string
) {
  const res = await fetch(
    `${BASE}/api/onboarding/sessions/${sessionId}/answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }
  );
  return json(res);
}
