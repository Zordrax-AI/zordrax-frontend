// src/lib/api.ts

/* =========================================================
   Base config (LIVE)
   - Backend exposes routes under /api/*
   - We keep BASE as the app root (so /health still works)
   - API_BASE = `${BASE}/api`
========================================================= */

const RAW_BASE =
  process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!RAW_BASE) {
  console.warn(
    "NEXT_PUBLIC_AGENT_BASE_URL (or NEXT_PUBLIC_ONBOARDING_API_URL) is not set"
  );
}

const BASE = (RAW_BASE || "").replace(/\/+$/, ""); // strip trailing slashes
const API_BASE = `${BASE}/api`;

function apiUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
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

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Try to surface FastAPI {"detail": "..."} nicely
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      throw new Error(j?.detail ? JSON.stringify(j.detail) : text);
    } catch {
      throw new Error(text || res.statusText);
    }
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
  cancel_requested?: boolean;
  created_at: string;
  updated_at: string;

  deploy?: {
    status?: string;
    pipeline_run_id?: string | number;
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
   Runs API (LIVE: /api/runs/*)
========================================================= */

export async function listRuns(limit = 50): Promise<RunRow[]> {
  // Backend route is /api/runs/ (note trailing slash)
  return request(`/runs/?limit=${limit}`);
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
  await request(`/runs/${runId}/cancel`, { method: "POST" });
}

/* =========================================================
   Deploy (Terraform) (LIVE: /api/deploy/*)
========================================================= */

export interface DeployPlanRequest {
  recommendation_id: string;

  // Optional backend-supported fields (you used these in curl)
  name_prefix?: string;
  region?: string;
  environment?: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
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
    `/deploy/plan`,
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

export interface DeployApplyResponse {
  run_id: string;
  status: string; // pipeline_started | infra_succeeded | ...
  pipeline_run_id: number;
}

export async function deployApply(
  runId: string,
  idempotencyKey?: string
): Promise<DeployApplyResponse> {
  return request(`/deploy/${runId}/apply`, { method: "POST" }, idempotencyKey);
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

export async function deployRefresh(runId: string): Promise<DeployRefreshResponse> {
  return request(`/deploy/${runId}/refresh`);
}

/* =========================================================
   Infra Outputs (LIVE: /api/infra/outputs/*)
========================================================= */

export async function getInfraOutputs(runId: string): Promise<any> {
  return request(`/infra/outputs/${runId}`);
}
