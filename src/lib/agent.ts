// src/lib/agent.ts

/* =========================================================
   Types
   ========================================================= */

export type ZordraxRun = {
  id: string;
  mode: string;
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
  mode: string;
};

/* =========================================================
   Base URL resolution
   ========================================================= */

const BASE =
  (process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "").replace(/\/$/, "");

function assertBase() {
  if (!BASE) {
    console.error(
      "❌ Missing NEXT_PUBLIC_AGENT_BASE_URL (or NEXT_PUBLIC_API_BASE_URL)"
    );
    throw new Error("API base URL not configured");
  }
}

/* =========================================================
   Helpers
   ========================================================= */

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/* =========================================================
   API Calls
   ========================================================= */

/** Start a deployment run */
export async function onboard(
  payload: OnboardRequest
): Promise<OnboardResponse> {
  assertBase();

  const res = await fetch(`${BASE}/api/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<OnboardResponse>(res);
}

/** List deployment runs */
export async function listRuns(
  limit = 50,
  offset = 0
): Promise<ZordraxRun[]> {
  assertBase();

  const url = new URL(`${BASE}/api/runs`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), {
    method: "GET",
  });

  const data = await parseJson<{ items: ZordraxRun[] }>(res);
  return data.items;
}

/** Fetch a single run */
export async function getRun(runId: string): Promise<ZordraxRun> {
  assertBase();

  const res = await fetch(`${BASE}/api/runs/${encodeURIComponent(runId)}`);
  return parseJson<ZordraxRun>(res);
}

/** SSE events URL */
export function getRunEventsUrl(runId: string): string {
  assertBase();
  return `${BASE}/api/runs/${encodeURIComponent(runId)}/events`;
}

/** Cancel a run */
export async function cancelRun(runId: string) {
  assertBase();
  const res = await fetch(`${BASE}/api/runs/${runId}/cancel`, {
    method: "POST",
  });
  return parseJson(res);
}

/** Retry a failed run */
export async function retryRun(runId: string) {
  assertBase();
  const res = await fetch(`${BASE}/api/runs/${runId}/retry`, {
    method: "POST",
  });
  return parseJson(res);
}
