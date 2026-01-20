// src/lib/api.ts
/* =========================================================
   Zordrax Frontend <-> Onboarding Agent API (SSOT-ish)
   - Forces HTTPS for non-localhost to prevent Mixed Content
   - Central fetch helper + typed endpoints
========================================================= */

export type RecommendRequest = {
  mode: "manual" | "ai";
  industry: string;
  scale: "small" | "medium" | "large";
  cloud: "azure" | "aws" | "gcp";
};

export type ArchitectureRecommendation = {
  source: "ai" | "manual";
  title?: string;
  // Keep the rest flexible until backend contract is finalized
  [k: string]: unknown;
};

export type RecommendationSnapshotCreate = {
  final: Record<string, never>;
  ai: Record<string, never> | null;
  diff: unknown[];
  source_query: Record<string, never>;
};

export type DeployPlanRequest = {
  recommendation_id: string;

  // Optional overrides (backend can default)
  name_prefix?: string;
  region?: string;
  environment?: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
};

export type DeployPlanResponse = {
  run_id: string;
  status: string; // awaiting_approval, etc.
  plan_summary: Record<string, unknown>;
  policy_warnings?: string[];
};

export type DeployApplyResponse = {
  run_id: string;
  status: string;
  pipeline_run_id?: number | string;
};

export type RunRow = {
  run_id: string;
  mode: "manual" | "ai";
  title?: string;
  status: string; // infra_succeeded, pipeline_running, etc.
  stage: string;  // deploy, infra, pipeline...
  cancel_requested: boolean;
  created_at: string;
  updated_at: string;

  // present in your backend response
  deploy?: {
    status?: string;
    pipeline_run_id?: number | string;
    region?: string;
    environment?: string;
  };
};

export type RunEvent = {
  id: number;
  run_id: string;
  level: "info" | "warning" | "error";
  stage: string;
  status: string;
  message: string;
  created_at: string;
};

export type InfraOutputsResponse = {
  run_id: string;
  found: boolean;
  status: "succeeded" | "failed" | "running" | string;
  outputs?: Record<string, { type: string; value: unknown; sensitive: boolean }>;
  updated_at?: string;
};

export type RunsListResponse =
  | RunRow[]
  | { items: RunRow[] }
  | { runs: RunRow[] };

/* =========================================================
   Base URL (FORCE HTTPS to prevent Mixed Content)
========================================================= */

function normalizeBaseUrl(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

  // If user forgot protocol, assume https (unless localhost)
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const withProto = hasProtocol
    ? trimmed
    : trimmed.includes("localhost") || trimmed.includes("127.0.0.1")
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    // last resort: treat as https host
    url = new URL(`https://${trimmed.replace(/^\/+/, "")}`);
  }

  // HARD FIX: upgrade http->https for anything not localhost
  const isLocal =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (!isLocal && url.protocol === "http:") {
    url.protocol = "https:";
  }

  // Remove trailing slash for consistent joins
  return url.toString().replace(/\/+$/, "");
}

function resolveApiBase(): string {
  const env =
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL || // optional compatibility
    "http://localhost:8000";

  const base = normalizeBaseUrl(env);

  // In production, refuse empty
  if (!base) {
    throw new Error(
      "API base URL is not set. Set NEXT_PUBLIC_AGENT_BASE_URL in Vercel."
    );
  }
  return base;
}

export const API_BASE = resolveApiBase();

/* =========================================================
   Fetch helper
========================================================= */

async function readErrorBody(res: Response): Promise<string> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      return typeof j === "string" ? j : JSON.stringify(j);
    }
    return await res.text();
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function fetchJson<T>(
  path: string,
  opts?: RequestInit & { idempotencyKey?: string }
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers as Record<string, string> | undefined),
  };

  if (opts?.idempotencyKey) {
    headers["Idempotency-Key"] = opts.idempotencyKey;
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    // IMPORTANT: do not force credentials unless you need cookies
    // credentials: "include",
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(body || `Request failed: ${res.status} ${res.statusText}`);
  }

  // Some endpoints may return empty body
  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // If backend returns plain text
    return text as unknown as T;
  }
}

/* =========================================================
   Endpoints
========================================================= */

export async function health(): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>("/health", { method: "GET" });
}

/* ---------- Deploy flow ---------- */

export async function deployPlan(
  req: DeployPlanRequest,
  idempotencyKey?: string
): Promise<DeployPlanResponse> {
  return fetchJson<DeployPlanResponse>("/api/deploy/plan", {
    method: "POST",
    body: JSON.stringify(req),
    idempotencyKey,
  });
}

export async function deployApprove(
  runId: string,
  idempotencyKey?: string
): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/deploy/approve/${runId}`, {
    method: "POST",
    body: JSON.stringify({}),
    idempotencyKey,
  });
}

export async function deployApply(
  runId: string,
  idempotencyKey?: string
): Promise<DeployApplyResponse> {
  return fetchJson<DeployApplyResponse>(`/api/deploy/apply/${runId}`, {
    method: "POST",
    body: JSON.stringify({}),
    idempotencyKey,
  });
}

/* ---------- Runs + status ---------- */

export async function getRun(runId: string): Promise<RunRow> {
  return fetchJson<RunRow>(`/api/runs/${runId}`, { method: "GET" });
}

export async function getRunEvents(
  runId: string,
  afterId = 0
): Promise<RunEvent[]> {
  const qs = new URLSearchParams();
  if (afterId > 0) qs.set("after_id", String(afterId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchJson<RunEvent[]>(`/api/runs/${runId}/events${suffix}`, {
    method: "GET",
  });
}

export async function getInfraOutputs(
  runId: string
): Promise<InfraOutputsResponse> {
  return fetchJson<InfraOutputsResponse>(`/api/infra/outputs/${runId}`, {
    method: "GET",
  });
}

export async function cancelRun(runId: string): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/runs/${runId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/* List runs (supports a few likely backend shapes) */
export async function listRuns(): Promise<RunRow[]> {
  const data = await fetchJson<RunsListResponse>("/api/runs", { method: "GET" });

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  if ("runs" in data && Array.isArray(data.runs)) return data.runs;

  return [];
}

/* ---------- AI Recommend (backend not live yet) ---------- */

export async function recommendStack(
  req: RecommendRequest
): Promise<ArchitectureRecommendation> {
  // Your UI shows this error: agent does not expose /api/ai/recommend-stack yet.
  // Keep the call, but make the error clean.
  return fetchJson<ArchitectureRecommendation>("/api/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/* Optional: snapshot endpoint (only if you’ve actually implemented it server-side) */
export async function saveRecommendationSnapshot(
  snapshot: RecommendationSnapshotCreate
): Promise<{ id: string }> {
  return fetchJson<{ id: string }>("/api/recommendations/snapshots", {
    method: "POST",
    body: JSON.stringify(snapshot),
  });
}
