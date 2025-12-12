// ------------------------------------------
// BASE URL
// ------------------------------------------
const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!BASE) {
  console.warn("❌ NEXT_PUBLIC_ONBOARDING_API_URL is missing!");
}

function url(path: string) {
  return `${BASE}${path}`;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json();
}

// ------------------------------------------
// AI RECOMMENDATION (POST /ai/recommend-stack)
// ------------------------------------------
export async function aiRecommendStack(goal: string) {
  return request("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify({ answers: { goal } }),
  });
}

// ------------------------------------------
// SESSIONS (placeholder until backend built)
// ------------------------------------------
import type { OnboardingSession } from "@/lib/types";

export async function fetchSessions(): Promise<OnboardingSession[]> {
  return [
    {
      id: "demo-1",
      project_name: "Example Session",
      created_at: new Date().toISOString(),
      status: "completed",
      summary: "This is a placeholder session until backend is built.",
    },
  ];
}

// ------------------------------------------
// RUNS + PIPELINE STATUS
// ------------------------------------------
export async function fetchRuns() {
  return request("/pipeline/history");
}

export async function fetchRunStatus(id: string) {
  return request(`/pipeline/status/${id}`);
}

// ------------------------------------------
// OBSERVABILITY (placeholder)
// ------------------------------------------
export async function fetchObservabilityOverview() {
  return {
    total_runs: 0,
    succeeded_runs: 0,
    failed_runs: 0,
    running_runs: 0,
    last_run: null,
  };
}

export async function fetchObservabilityTimeline() {
  return {
    count: 0,
    items: [],
  };
}
