// src/lib/api.ts

/* =========================================================
   Base config
========================================================= */

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!BASE) {
  console.warn("NEXT_PUBLIC_ONBOARDING_API_URL is not set");
}

function url(path: string) {
  return `${BASE}${path}`;
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

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

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

  /** Optional runtime artifacts (Terraform, etc.) */
  manifest?: {
    outputs?: Record<
      string,
      {
        value: unknown;
      }
    >;
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
   Runs API
========================================================= */

export async function listRuns(limit = 50): Promise<RunRow[]> {
  return request(`/runs?limit=${limit}`);
}

export async function getRun(runId: string): Promise<RunRow> {
  return request(`/runs/${runId}`);
}

export async function getRunEvents(
  runId: string,
  afterId = 0
): Promise<RunEvent[]> {
  return request(`/runs/${runId}/events?after_id=${afterId}`);
}

export async function cancelRun(runId: string): Promise<void> {
  await request(`/runs/${runId}/cancel`, {
    method: "POST",
  });
}

/* =========================================================
   AI Recommendation
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
  return request("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   Recommendation Snapshots (IMMUTABLE)
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
  return request("/recommendations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   Deploy (Terraform)
========================================================= */

export interface DeployPlanRequest {
  recommendation_id: string;
}

export interface DeployPlanResponse {
  run_id: string;
  status: "awaiting_approval";
  plan_summary: Record<string, unknown>;
  policy_warnings: string[];
}

export async function deployPlan(
  payload: DeployPlanRequest,
  idempotencyKey?: string
): Promise<DeployPlanResponse> {
  return request(
    "/deploy/plan",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    idempotencyKey
  );
}

export async function deployApprove(
  runId: string,
  idempotencyKey?: string
): Promise<{ run_id: string; status: string }> {
  return request(`/deploy/${runId}/approve`, { method: "POST" }, idempotencyKey);
}

export async function deployReject(
  runId: string,
  reason?: string,
  idempotencyKey?: string
): Promise<void> {
  await request(
    `/deploy/${runId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    idempotencyKey
  );
}

/**
 * NEW: Apply endpoint (triggers the Azure DevOps pipeline)
 * Backend must expose: POST /deploy/{runId}/apply
 */
export interface DeployApplyResponse {
  run_id: string;
  status: "pipeline_started" | string;
  pipeline_run_id: number;
}

export async function deployApply(
  runId: string,
  idempotencyKey?: string
): Promise<DeployApplyResponse> {
  return request(`/deploy/${runId}/apply`, { method: "POST" }, idempotencyKey);
}
