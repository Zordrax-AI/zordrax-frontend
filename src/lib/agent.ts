// src/lib/agent.ts

export type OnboardRequest = {
  mode: "ai" | "manual";
  session_id?: string;
  answers?: Record<string, any>;
  config?: Record<string, any>;
};

export type OnboardResponse = {
  run_id: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  stage?: string;
};

export type ZordraxRun = {
  id: string;
  mode: "ai" | "manual" | string;
  title: string;
  status: string;
  stage: string;
  created_at: number;
  updated_at: number;
};

const RAW_BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL || "";
const base = RAW_BASE.replace(/\/$/, "");

function assertBase() {
  if (!base) {
    // eslint-disable-next-line no-console
    console.warn("Missing NEXT_PUBLIC_AGENT_BASE_URL in env.");
    throw new Error("NEXT_PUBLIC_AGENT_BASE_URL is missing");
  }
}

function api(path: string) {
  assertBase();
  return `${base}/api${path}`;
}

async function okJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) ${text ? `→ ${text}` : ""}`.trim());
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// -------------------- RUNS --------------------

export async function onboard(payload: OnboardRequest): Promise<OnboardResponse> {
  const res = await fetch(api("/onboard"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return okJson<OnboardResponse>(res);
}

export async function listRuns(limit = 50, offset = 0): Promise<{ items: ZordraxRun[] }> {
  const url = new URL(api("/runs"));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  const res = await fetch(url.toString(), { method: "GET" });
  return okJson<{ items: ZordraxRun[] }>(res);
}

export async function getRunStatus(runId: string): Promise<ZordraxRun> {
  const res = await fetch(api(`/runs/${encodeURIComponent(runId)}`), { method: "GET" });
  return okJson<ZordraxRun>(res);
}

export function getEventsUrl(runId: string) {
  return api(`/runs/${encodeURIComponent(runId)}/events`);
}

export async function cancelRun(runId: string) {
  const res = await fetch(api(`/runs/${encodeURIComponent(runId)}/cancel`), { method: "POST" });
  return okJson<any>(res);
}

export async function retryRun(runId: string) {
  const res = await fetch(api(`/runs/${encodeURIComponent(runId)}/retry`), { method: "POST" });
  return okJson<any>(res);
}

// -------------------- SESSIONS --------------------

export async function createSession(): Promise<{ session_id: string }> {
  const res = await fetch(api("/onboarding/sessions"), { method: "POST" });
  return okJson<{ session_id: string }>(res);
}

export async function getNextQuestion(sessionId: string): Promise<any> {
  const res = await fetch(api(`/onboarding/sessions/${encodeURIComponent(sessionId)}/next-question`));
  return okJson<any>(res);
}

export async function answerQuestion(sessionId: string, key: string, value: string): Promise<any> {
  const res = await fetch(api(`/onboarding/sessions/${encodeURIComponent(sessionId)}/answer`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  return okJson<any>(res);
}
