// src/lib/api.ts

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!BASE) {
  console.warn("❌ NEXT_PUBLIC_ONBOARDING_API_URL missing");
}

function url(path: string) {
  return `${BASE}${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json();
}

/* =========================
   Types
========================= */

export type RunRow = {
  run_id: string;
  mode: string;
  title: string;
  status: string;
  stage: string;
  created_at: string;
  cancel_requested?: boolean;
  manifest?: any;
};

export type RunEvent = {
  event_id: number;
  run_id: string;
  level: "info" | "warn" | "error";
  status: string;
  stage: string;
  message: string;
  created_at: string;
  data?: any;
};

/* =========================
   API functions
========================= */

export function createRun(mode: string, title: string) {
  return request<{ run_id: string }>(`/runs/`, {
    method: "POST",
    body: JSON.stringify({ mode, title }),
  });
}

export function executeRun(runId: string) {
  return request<{ run_id: string; status: string }>(
    `/runs/${runId}/execute`,
    { method: "POST" }
  );
}

export function cancelRun(runId: string) {
  return request<{ run_id: string; status: string }>(
    `/runs/${runId}/cancel`,
    { method: "POST" }
  );
}

export function listRuns() {
  return request<RunRow[]>(`/runs/`);
}

export function getRun(runId: string) {
  return request<RunRow>(`/runs/${runId}`);
}

export function getRunEvents(runId: string, afterId: number = 0) {
  return request<RunEvent[]>(
    `/runs/${runId}/events?after_id=${afterId}`
  );
}

/* =========================
   Optional SSE helper
========================= */

export function runEventsStreamUrl(runId: string, afterId = 0) {
  return url(`/runs/${runId}/events/stream?after_id=${afterId}`);
}
