// src/lib/agent.ts

/* ================= TYPES ================= */

export type ZordraxRun = {
  id: string;
  mode: "ai" | "manual" | string;
  title: string;
  status: string;
  stage: string;
  created_at: number;
  updated_at: number;
};

export type OnboardRequest = {
  mode: "ai" | "manual";
  session_id?: string;
  answers?: Record<string, any>;
};

export type OnboardResponse = {
  run_id: string;
  status: string;
  stage: string;
};

/* ================= BASE URL ================= */

const base =
  (process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "").replace(/\/$/, "");

function assertBase() {
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_AGENT_BASE_URL or NEXT_PUBLIC_API_BASE_URL"
    );
  }
}

/* ================= HELPERS ================= */

async function okJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/* ================= RUNS ================= */

export async function listRuns(
  limit = 50,
  offset = 0
): Promise<ZordraxRun[]> {
  assertBase();
  const url = new URL(`${base}/api/runs`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString());
  const data = await okJson<{ items: ZordraxRun[] }>(res);
  return data.items;
}

export async function getRun(runId: string): Promise<ZordraxRun> {
  assertBase();
  const res = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}`);
  return okJson<ZordraxRun>(res);
}

/* ================= BACKWARD COMPAT ================= */

// 🔒 DO NOT REMOVE — older UI code depends on this name
export const getRunStatus = getRun;

/* ================= ONBOARD ================= */

export async function onboard(
  payload: OnboardRequest
): Promise<OnboardResponse> {
  assertBase();
  const res = await fetch(`${base}/api/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return okJson<OnboardResponse>(res);
}

/* ================= EVENTS ================= */

export function getEventsUrl(runId: string): string {
  assertBase();
  return `${base}/api/runs/${encodeURIComponent(runId)}/events`;
}
