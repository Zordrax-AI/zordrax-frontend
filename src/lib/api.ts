import { getBackendBaseUrl } from "./config";
import type {
  AiRecommendationRequest,
  AiRecommendationResponse,
  OnboardingSession,
  DeployRun,
  PipelineStatus
} from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend URL not set. Missing NEXT_PUBLIC_ONBOARDING_API_URL.");
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

// ---------------- AI ----------------

export function aiRecommendStack(
  body: AiRecommendationRequest
): Promise<AiRecommendationResponse> {
  return request("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ---------------- Sessions ----------------

export function fetchSessions(): Promise<OnboardingSession[]> {
  return request("/onboarding/sessions");
}

// ---------------- Deployments ----------------

export function fetchRuns(): Promise<DeployRun[]> {
  return request("/deploy/runs");
}

export function fetchStatus(runId: string): Promise<PipelineStatus> {
  return request(`/deploy/status?run=${encodeURIComponent(runId)}`);
}
