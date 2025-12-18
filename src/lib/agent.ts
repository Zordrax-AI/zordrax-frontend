// src/lib/agent.ts

export type OnboardRequest = {
  mode: "ai" | "manual";
  session_id?: string;
  answers?: Record<string, any>;
  config?: Record<string, any>;
};

export type OnboardResponse = {
  run_id: string;
  status: string;
  stage: string;
  mode?: string;
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

const base =
  (process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "").replace(/\/$/, "");

function assertBase() {
  if (!base) {
    // eslint-disable-next-line no-console
    console.warn(
      "Missing API base URL. Set NEXT_PUBLIC_AGENT_BASE_URL (preferred) or NEXT_PUBLIC_API_BASE_URL."
    );
    throw new Error("API base URL missing");
  }
}

async function okJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Request failed (${res.status}) ${text ? `→ ${text}` : ""}`.trim()
    );
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/**
 * Start a run (deploy). Backend route: POST /api/onboard
 */
export async function onboard(payload: OnboardRequest): Promise<OnboardResponse> {
  assertBase();
  const res = await fetch(`${base}/api/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return okJson<OnboardResponse>(res);
}

/**
 * List runs. Backend route: GET /api/runs → { items: ZordraxRun[] } OR ZordraxRun[]
 * We normalize to ZordraxRun[].
 */
export async function listRuns(limit = 50, offset = 0): Promise<ZordraxRun[]> {
  assertBase();
  const url = new URL(`${base}/api/runs`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await okJson<any>(res);

  // Normalize both shapes:
  // - { items: [...] }
  // - [...]
  if (Array.isArray(data)) return data as ZordraxRun[];
  if (data && Array.isArray(data.items)) return data.items as ZordraxRun[];

  return [];
}

/**
 * Get run status. Backend route: GET /api/runs/{runId}
 */
export async function getRunStatus(runId: string): Promise<ZordraxRun> {
  assertBase();
  const res = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}`);
  return okJson<ZordraxRun>(res);
}

/**
 * SSE URL. Backend route: GET /api/runs/{runId}/events
 */
export function getEventsUrl(runId: string) {
  assertBase();
  return `${base}/api/runs/${encodeURIComponent(runId)}/events`;
}

/**
 * Cancel run. Backend route: POST /api/runs/{runId}/cancel
 */
export async function cancelRun(runId: string) {
  assertBase();
  const res = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}/cancel`, {
    method: "POST",
  });
  return okJson<any>(res);
}

/**
 * Retry run. Backend route: POST /api/runs/{runId}/retry
 */
export async function retryRun(runId: string) {
  assertBase();
  const res = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}/retry`, {
    method: "POST",
  });
  return okJson<any>(res);
}
