// src/lib/api.ts

/* =========================================================
   Base config (CANONICAL)
   - Frontend talks to the Agent service only
   - Agent exposes routes under /api/*
========================================================= */

const BASE =
  process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE) {
  // This runs at build time too; don't crash the build.
  console.warn(
    "Missing API base URL. Set NEXT_PUBLIC_AGENT_BASE_URL in .env / Vercel."
  );
}

function url(path: string) {
  const b = (BASE || "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * Request helper:
 * - JSON by default when sending a body
 * - Optional idempotency keys
 * - Throws server text for debugging
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  idempotencyKey?: string
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const method = (options.method || "GET").toUpperCase();
  const hasBody =
    typeof options.body !== "undefined" &&
    options.body !== null &&
    options.body !== "";

  if (!headers["Content-Type"] && (hasBody || method !== "GET")) {
    headers["Content-Type"] = "application/json";
  }

  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const res = await fetch(url(path), { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // @ts-expect-error allow non-json/no-body responses
    return undefined;
  }

  return res.json();
}

/* =========================================================
   Types (backend-aligned)
========================================================= */

export interface RunRow {
  run_id: string;
  mode: "ai" | "manual";
  title: string;

  status: string;
  stage: string;

  cancel_requested?: boolean;

  created_at: string;
  updated_at: string;

  deploy?: {
    status?: string;
    pipeline_run_id?: string; // ADO run number as string in your backend payload
    region?: string;
    environment?: string;
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
   Runs API (Agent: /api/runs/*)
========================================================= */

export async function listRuns(limit = 50): Promise<RunRow[]> {
  return request(`/api/runs?limit=${limit}`);
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
   Deploy (Agent: /api/deploy/*)
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
  status: string; // awaiting_approval
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
): Promise<{ run_id: string; status: string }> {
  return request(
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
  pipeline: {
    pipeline_id: number;
    pipeline_run_id: number;
    state: string;
    result?: string | null;
    url?: string | null;
  };
}

export async function deployRefresh(
  runId: string
): Promise<DeployRefreshResponse> {
  return request(`/api/deploy/${runId}/refresh`);
}

/* =========================================================
   Infra Outputs (Agent: /api/infra/outputs/{run_id})
========================================================= */

export interface InfraOutputsResponse {
  run_id: string;
  found: boolean;
  status?: string;
  outputs?: Record<
    string,
    {
      type?: string;
      value?: unknown;
      sensitive?: boolean;
    }
  >;
  updated_at?: string;
}

export async function getInfraOutputs(
  runId: string
): Promise<InfraOutputsResponse> {
  return request(`/api/infra/outputs/${runId}`);
}

/* =========================================================
   AI Recommendation + Snapshots (NOT LIVE YET ON AGENT)
   - Keep types exported so frontend compiles
   - Functions throw so UI shows honest message
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

export async function recommendStack(
  _payload: RecommendRequest
): Promise<ArchitectureRecommendation> {
  // When implemented on Agent: POST /api/ai/recommend-stack
  throw new Error(
    "recommendStack not available: Agent does not expose /api/ai/recommend-stack yet."
  );
}

export async function saveRecommendationSnapshot(
  _payload: RecommendationSnapshotCreate
): Promise<RecommendationSnapshotSaved> {
  // When implemented on Agent: POST /api/recommendations
  throw new Error(
    "saveRecommendationSnapshot not available: Agent does not expose /api/recommendations yet."
  );
}
