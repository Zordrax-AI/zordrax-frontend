// src/lib/api.ts

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!BASE) {
  console.warn("❌ NEXT_PUBLIC_ONBOARDING_API_URL missing");
}

function url(path: string) {
  return `${BASE}${path}`;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
   TYPES
========================= */

export type RunRow = {
  run_id: string;
  mode: string;
  title: string;
  status: string;
  stage: string;
  created_at: string;
  cancel_requested?: boolean;
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

export type RecommendRequest = {
  mode: "manual" | "ai";
  industry: string;
  scale: string;
  cloud: string;
};

export type RecommendResponse = {
  cloud: string;
  region: string;
  env: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
};

/* =========================
   RUN APIS
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

export function runEventsStreamUrl(runId: string, afterId = 0) {
  return url(`/runs/${runId}/events/stream?after_id=${afterId}`);
}

/* =========================
   AI RECOMMENDATION
========================= */

export function recommendStack(payload: RecommendRequest) {
  return request<RecommendResponse>(`/ai/recommend-stack`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveRecommendationSnapshot(payload: {
  id: string;
  ai: any;
  final: any;
  diff: any[];
  source_query?: Record<string, string>;
  run_id?: string;
}) {
  return request<{ id: string; status: string }>(
    `/recommendations`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function loadRecommendationSnapshot(recId: string) {
  return request<{
    id: string;
    created_at: string;
    ai: any;
    final: any;
    diff: any[];
    source_query?: Record<string, string>;
    run_id?: string;
  }>(`/recommendations/${recId}`);
}
