// src/lib/api.ts
import type { components } from "@/generated/api";

const RAW_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

export const BASE =
  RAW_BASE && RAW_BASE.trim().length > 0
    ? RAW_BASE.trim().replace(/\/$/, "")
    : "http://localhost:8000";

function url(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
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

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

/* =========================
   TYPES (from SSOT)
========================= */

export type RecommendRequest = components["schemas"]["RecommendRequest"];
export type ArchitectureRecommendation = components["schemas"]["ArchitectureRecommendation"];

export type RecommendationSnapshotCreate =
  components["schemas"]["RecommendationSnapshotCreate"];
export type RecommendationSnapshotSaved =
  components["schemas"]["RecommendationSnapshotSaved"];

export type DeployPlanRequest = components["schemas"]["DeployPlanRequest"];
export type DeployPlanResponse = components["schemas"]["DeployPlanResponse"];
export type DeployApproveResponse = components["schemas"]["DeployApproveResponse"];

// convenience aliases
export type RecommendMode = RecommendRequest["mode"];

/* =========================
   API CALLS (SSOT)
========================= */

export function recommendStack(payload: RecommendRequest) {
  return request<ArchitectureRecommendation>(`/ai/recommend-stack`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveRecommendationSnapshot(payload: RecommendationSnapshotCreate) {
  return request<RecommendationSnapshotSaved>(`/recommendations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deployPlan(payload: DeployPlanRequest) {
  return request<DeployPlanResponse>(`/deploy/plan`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deployApprove(runId: string) {
  return request<DeployApproveResponse>(`/deploy/${runId}/approve`, {
    method: "POST",
  });
}

export function deployReject(runId: string, reason?: string) {
  return request(`/deploy/${runId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
