// src/lib/api.ts

/* =========================================================
   Base config
========================================================= */

const BASE =
  process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

if (!BASE) {
  console.warn(
    "API base URL is not set. Set NEXT_PUBLIC_AGENT_BASE_URL (preferred)."
  );
}

function url(path: string) {
  // ensure we never end up with double slashes
  const base = BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Enterprise-safe request helper:
 * - Adds JSON headers by default
 * - Supports optional idempotency keys (retry-safe UX)
 * - Throws server error text for easier debugging
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  idempotencyKey?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const res = await fetch(url(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // @ts-expect-error allow non-json/no-body responses
    return undefined;
  }

  return res.json();
}

/* =========================================================
   Core Run Types (BACKEND-ALIGNED)
========================================================= */

export interface RunRow {
  run_id: string;
  title: string;
  mode: "ai" | "manual";
  status: string;
  stage: string;
  created_at: string;
  updated_at: string;

  manifest?: {
    outputs?: Record<string, { value: unknown }>;
  };
}

export interface RunEvent {
  id: number;
  run_id: string;
  level: "info" | "warning" | "error";
  stage: string;
  status: string;
  message: string;
  created_at: string;
}

/* =========================================================
   Runs API  (NOTE: backend is /api/runs/*)
========================================================= */

export async function listRuns(limit = 50): Promise<RunRow[]> {
  return request(`/api/runs/?limit=${limit}`);
}

export async function getRun(runId: string): Promise<RunRow> {
  return request(`/api/runs/${runId}`);
}

export async function getRunEvents(
  runId: string,
  afterId = 0
): Promise<RunEvent[]> {
  return request(`/api/runs/${runId}/events?after_id=${afterId}`);
}

export async function cancelRun(runId: string): Promise<void> {
  await request(`/api/runs/${runId}/cancel`, { method: "POST" });
}

/* =========================================================
   AI Recommendation  (frontend expects these exports)
   IMPORTANT: Only works if backend exposes /api/ai/recommend-stack
========================================================= */

export interface RecommendRequest {
  mode: "ai" | "manual";
  industry: string;
  scale: "small" | "medium" | "large";
  cloud: "azure" | "aws" | "gcp";
}

export interface ArchitectureRecommendation {
  cloud: string;
  region: string;
  env: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
  source: "ai" | "manual";
  warnings?: string[];
  reasoning?: string[];
}

export async function recommendStack(
  payload: RecommendRequest
): Promise<ArchitectureRecommendation> {
  return request("/api/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   Recommendation Snapshots (frontend expects these exports)
   IMPORTANT: Only works if backend exposes /api/recommendations
========================================================= */

export interface RecommendationSnapshotCreate {
  final: Record<string, unknown>;
  ai?: Record<string, unknown> | null;
  diff?: unknown[];
  source_query?: Record<string, unknown> | null;
  run_id?: string | null;
}

export interface RecommendationSnapshotSaved {
  id: string;
  status: "saved";
}

export async function saveRecommendationSnapshot(
  payload: RecommendationSnapshotCreate
): Promise<RecommendationSnapshotSaved> {
  return request("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   Deploy (Terraform)  (backend is /api/deploy/*)
========================================================= */

export interface DeployPlanRequest {
  recommendation_id: string;
  name_prefix?: string;
  region?: string;
  environment?: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
}

export interface DeployPlanResponse {
  run_id: string;
  status: string;
  plan_summary: Record<string, unknown>;
  policy_warnings: string[];
}

export async function deployPlan(
  payload: DeployPlanRequest,
  idempotencyKey?: string
): Promise<DeployPlanResponse> {
  return request(
    "/api/deploy/plan",
    { method: "POST", body: JSON.stringify(payload) },
    idempotencyKey
  );
}

export async function deployApprove(
  runId: string,
  idempotencyKey?: string
): Promise<{ run_id: string; status: string }> {
  return request(
    `/api/deploy/${runId}/approve`,
    { method: "POST" },
    idempotencyKey
  );
}

export async function deployReject(
  runId: string,
  reason?: string,
  idempotencyKey?: string
): Promise<void> {
  await request(
    `/api/deploy/${runId}/reject`,
    { method: "POST", body: JSON.stringify({ reason }) },
    idempotencyKey
  );
}

export interface DeployApplyResponse {
  run_id: string;
  status: string;
  pipeline_run_id: number;
}

export async function deployApply(
  runId: string,
  idempotencyKey?: string
): Promise<DeployApplyResponse> {
  return request(
    `/api/deploy/${runId}/apply`,
    { method: "POST" },
    idempotencyKey
  );
}

export interface DeployRefreshResponse {
  run_id: string;
  previous_status: string;
  current_status: string;
  changed: boolean;
  pipeline?: {
    pipeline_id: number;
    pipeline_run_id: number;
    state: string;
    result?: string | null;
    url?: string | null;
  };
}

export async function deployRefresh(runId: string): Promise<DeployRefreshResponse> {
  return request(`/api/deploy/${runId}/refresh`);
}

export async function getInfraOutputs(runId: string): Promise<any> {
  return request(`/api/infra/outputs/${runId}`);
}
