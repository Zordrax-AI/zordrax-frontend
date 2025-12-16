// src/lib/agent.ts
export type OnboardRequest = {
  mode: "ai" | "manual";
  answers?: Record<string, any>;
  config?: Record<string, any>;
};

export type OnboardResponse = {
  run_id: string;
  status: "queued" | "running" | "completed" | "failed";
  events_url?: string; // SSE endpoint
  status_url?: string; // optional
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
  (process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
    "").replace(/\/$/, "");

function assertBase() {
  if (!base) {
    // eslint-disable-next-line no-console
    console.warn(
      "❌ Missing API base URL. Set NEXT_PUBLIC_API_BASE_URL in Vercel (Production + Preview)."
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

export async function onboard(payload: OnboardRequest): Promise<OnboardResponse> {
  assertBase();
  const res = await fetch(`${base}/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return okJson<OnboardResponse>(res);
}

export async function listRuns(limit = 50, offset = 0): Promise<ZordraxRun[]> {
  assertBase();
  const url = new URL(`${base}/runs`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  const res = await fetch(url.toString(), { method: "GET" });
  return okJson<ZordraxRun[]>(res);
}

export function getEventsUrl(runId: string) {
  assertBase();
  return `${base}/runs/${encodeURIComponent(runId)}/events`;
}

export async function getRunStatus(runId: string): Promise<ZordraxRun> {
  assertBase();
  const res = await fetch(`${base}/runs/${encodeURIComponent(runId)}`);
  return okJson<ZordraxRun>(res);
}
