// src/lib/api.ts
/* =========================================================
   Zordrax Frontend <-> Onboarding Agent API (SSOT)
   - Forces HTTPS for non-localhost to prevent Mixed Content
   - Typed endpoints
   - Robust ApiError w/ status codes
   - Fallbacks for approve/apply in case backend route differs
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
  [k: string]: unknown;
};

export type RecommendationSnapshotCreate = {
  final: Record<string, unknown>;
  ai: Record<string, unknown> | null;
  diff: unknown[];
  source_query: Record<string, unknown>;
};


export type DeployPlanRequest = {
  recommendation_id: string;
  name_prefix?: string;
  region?: string;
  environment?: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
};

export type DeployPlanResponse = {
  run_id: string;
  status: string;
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
  status: string;
  stage: string;
  cancel_requested: boolean;
  created_at: string;
  updated_at: string;

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

export type RunsListResponse = RunRow[] | { items: RunRow[] } | { runs: RunRow[] };

export class ApiError extends Error {
  status: number;
  url: string;
  body: string;

  constructor(args: { status: number; url: string; body: string; message?: string }) {
    super(args.message ?? `Request failed (${args.status})`);
    this.name = "ApiError";
    this.status = args.status;
    this.url = args.url;
    this.body = args.body;
  }
}

/* =========================================================
   Base URL (FORCE HTTPS to prevent Mixed Content)
========================================================= */

function normalizeBaseUrl(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

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
    url = new URL(`https://${trimmed.replace(/^\/+/, "")}`);
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal && url.protocol === "http:") url.protocol = "https:";

  return url.toString().replace(/\/+$/, "");
}

function resolveApiBase(): string {
  const env =
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL || // legacy compatibility
    "http://localhost:8000";

  const base = normalizeBaseUrl(env);

  if (!base) {
    throw new Error("API base URL is not set. Set NEXT_PUBLIC_AGENT_BASE_URL in Vercel.");
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

  if (opts?.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiError({
      status: res.status,
      url,
      body,
      message: body || `Request failed: ${res.status} ${res.statusText}`,
    });
  }

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* helper: try A, if 404 then try B */
async function tryOr404<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 404) {
      return await fallback();
    }
    throw e;
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

/**
 * Some backend builds expose:
 *   POST /api/deploy/approve/{runId}
 * Others expose:
 *   POST /api/deploy/approve   body: { run_id }
 */
export async function deployApprove(runId: string, idempotencyKey?: string): Promise<{ ok: boolean }> {
  return tryOr404(
    () =>
      fetchJson<{ ok: boolean }>(`/api/deploy/approve/${runId}`, {
        method: "POST",
        body: JSON.stringify({}),
        idempotencyKey,
      }),
    () =>
      fetchJson<{ ok: boolean }>(`/api/deploy/approve`, {
        method: "POST",
        body: JSON.stringify({ run_id: runId }),
        idempotencyKey,
      })
  );
}

/**
 * Some backend builds expose:
 *   POST /api/deploy/apply/{runId}
 * Others expose:
 *   POST /api/deploy/apply   body: { run_id }
 */
export async function deployApply(
  runId: string,
  idempotencyKey?: string
): Promise<DeployApplyResponse> {
  return tryOr404(
    () =>
      fetchJson<DeployApplyResponse>(`/api/deploy/apply/${runId}`, {
        method: "POST",
        body: JSON.stringify({}),
        idempotencyKey,
      }),
    () =>
      fetchJson<DeployApplyResponse>(`/api/deploy/apply`, {
        method: "POST",
        body: JSON.stringify({ run_id: runId }),
        idempotencyKey,
      })
  );
}

/* ---------- Runs + status ---------- */

export async function getRun(runId: string): Promise<RunRow> {
  return fetchJson<RunRow>(`/api/runs/${runId}`, { method: "GET" });
}

export async function getRunEvents(runId: string, afterId = 0): Promise<RunEvent[]> {
  const qs = new URLSearchParams();
  if (afterId > 0) qs.set("after_id", String(afterId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchJson<RunEvent[]>(`/api/runs/${runId}/events${suffix}`, { method: "GET" });
}

export async function getInfraOutputs(runId: string): Promise<InfraOutputsResponse> {
  return fetchJson<InfraOutputsResponse>(`/api/infra/outputs/${runId}`, { method: "GET" });
}

export async function cancelRun(runId: string): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/runs/${runId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/* List runs (supports a few likely backend shapes) */
export async function listRuns(): Promise<RunRow[]> {
  // Some builds might not expose list; keep UI stable.
  try {
    const data = await fetchJson<RunsListResponse>("/api/runs", { method: "GET" });

    if (Array.isArray(data)) return data;
    if ("items" in data && Array.isArray(data.items)) return data.items;
    if ("runs" in data && Array.isArray(data.runs)) return data.runs;

    return [];
  } catch (e: any) {
    // If backend truly doesn’t expose this route yet, don’t crash the page.
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

/* ---------- AI Recommend ---------- */

export async function recommendStack(req: RecommendRequest): Promise<ArchitectureRecommendation> {
  return fetchJson<ArchitectureRecommendation>("/api/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * Optional snapshot endpoint.
 * If backend not implemented yet -> return a clean error.
 */
export async function saveRecommendationSnapshot(
  snapshot: RecommendationSnapshotCreate
): Promise<{ id: string }> {
  try {
    return await fetchJson<{ id: string }>("/api/recommendations/snapshots", {
      method: "POST",
      body: JSON.stringify(snapshot),
    });
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 404) {
      throw new Error(
        "Snapshots aren’t enabled on the backend yet (endpoint /api/recommendations/snapshots not found)."
      );
    }
    throw e;
  }
}
