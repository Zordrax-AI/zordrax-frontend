// src/lib/api.ts
import type {
  PipelineStatus,
  RunHistoryResponse,
  OnboardingSession,
  ObservabilityOverview,
  ObservabilityPoint,
  ArchitectureRecommendation,
  OnboardingQuestion
} from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!BASE) {
  console.warn("❌ NEXT_PUBLIC_ONBOARDING_API_URL is missing!");
}

function url(path: string) {
  return `${BASE}${path}`;
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/* ------------------------------------------
   AI RECOMMENDATION  
   Backend: POST /ai/recommend-stack
------------------------------------------- */
export async function aiRecommendStack(goal: string): Promise<ArchitectureRecommendation> {
  return request<ArchitectureRecommendation>("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify({ answers: { goal } })
  });
}

/* ------------------------------------------
   DYNAMIC QUESTIONS  
   Backend: POST /ai/next-question
------------------------------------------- */
export async function fetchNextQuestion(
  previous_answers: Record<string, any>,
  industry?: string | null
): Promise<OnboardingQuestion> {
  return request<OnboardingQuestion>("/ai/next-question", {
    method: "POST",
    body: JSON.stringify({
      previous_answers,
      industry: industry ?? null
    })
  });
}

/* ------------------------------------------
   SESSIONS (placeholder)
------------------------------------------- */
export async function fetchSessions(): Promise<OnboardingSession[]> {
  // TODO: swap to real backend when /sessions exists
  return [
    {
      id: "demo-1",
      project_name: "Example Session",
      created_at: new Date().toISOString(),
      status: "completed",
      summary: "This is a placeholder session until backend is built."
    }
  ];
}

/* ------------------------------------------
   RUNS + PIPELINE STATUS
------------------------------------------- */
export async function fetchRuns(): Promise<RunHistoryResponse> {
  return request<RunHistoryResponse>("/pipeline/history");
}

export async function fetchRunStatus(id: string): Promise<PipelineStatus> {
  return request<PipelineStatus>(`/pipeline/status/${id}`);
}

/* ------------------------------------------
   OBSERVABILITY (frontend-only for now)
------------------------------------------- */
export async function fetchObservabilityOverview(): Promise<ObservabilityOverview> {
  const runs = await fetchRuns();
  const last = runs.items[0] ?? null;

  return {
    total_runs: runs.count,
    succeeded_runs: runs.items.filter((r) => r.result === "succeeded").length,
    failed_runs: runs.items.filter((r) => r.result === "failed").length,
    running_runs: runs.items.filter((r) => r.state !== "completed").length,
    last_run: last
  };
}

export async function fetchObservabilityTimeline(): Promise<{
  count: number;
  items: ObservabilityPoint[];
}> {
  return {
    count: 0,
    items: []
  };
}
