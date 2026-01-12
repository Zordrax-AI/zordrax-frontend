// src/lib/api.ts
// =======================================================
// Zordrax Frontend API Layer (SSOT)
// =======================================================
// Rules:
// - NO custom domain models
// - ALL types come from OpenAPI
// - Frontend NEVER invents contracts
// =======================================================

import type { components } from "@/generated/api";

/* =======================================================
   Re-export backend contract types
======================================================= */

export type RecommendRequest =
  components["schemas"]["RecommendRequest"];

export type ArchitectureRecommendation =
  components["schemas"]["ArchitectureRecommendation"];

export type RecommendationSnapshotCreate =
  components["schemas"]["RecommendationSnapshotCreate"];

export type RecommendationSnapshotSaved =
  components["schemas"]["RecommendationSnapshotSaved"];

export type DeployPlanRequest =
  components["schemas"]["DeployPlanRequest"];

export type DeployPlanResponse =
  components["schemas"]["DeployPlanResponse"];

export type DeployApproveResponse =
  components["schemas"]["DeployApproveResponse"];

/* =======================================================
   Runtime types (derived from backend responses)
======================================================= */

export type RunRow = {
  run_id: string;
  title?: string;
  status: string;
  stage?: string;
  mode?: string;
  created_at?: string;
  manifest?: any;
};

export type RunEvent = {
  event_id: number;
  level: string;
  message: string;
  created_at: string;
};

/* =======================================================
   Base URL
======================================================= */

const RAW_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

export const BASE =
  RAW_BASE && RAW_BASE.trim().length > 0
    ? RAW_BASE.trim().replace(/\/$/, "")
    : "http://localhost:8000";

function url(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BASE}${path}`;
}

/* =======================================================
   Request helper
======================================================= */

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
    throw new Error(await res.text());
  }

  return res.json() as Promise<T>;
}

/* =======================================================
   AI Recommendation
======================================================= */

export async function recommendStack(
  payload: RecommendRequest
): Promise<ArchitectureRecommendation> {
  return request("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =======================================================
   Recommendation Snapshots
======================================================= */

export async function saveRecommendationSnapshot(
  payload: RecommendationSnapshotCreate
): Promise<RecommendationSnapshotSaved> {
  return request("/recommendations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =======================================================
   Deploy lifecycle (Plan → Approve)
======================================================= */

export async function deployPlan(
  payload: DeployPlanRequest
): Promise<DeployPlanResponse> {
  return request("/deploy/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function approveDeploy(
  runId: string
): Promise<DeployApproveResponse> {
  return request(`/deploy/${runId}/approve`, {
    method: "POST",
  });
}

/* =======================================================
   Runs
======================================================= */

export async function listRuns(): Promise<RunRow[]> {
  return request("/runs/");
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
