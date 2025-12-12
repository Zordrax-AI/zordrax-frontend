// src/lib/api.ts

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;
if (!BASE) {
  // This will show up in the browser + build logs
  console.error("❌ NEXT_PUBLIC_ONBOARDING_API_URL is missing!");
}

function url(path: string) {
  return `${BASE}${path}`;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json();
}

/* ===============================
   AI RECOMMENDATION
================================ */
export async function aiRecommendStack(goal: string) {
  // Backend expects OnboardingAnswers with "answers" field
  return request("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify({ answers: { goal } })
  });
}

/* ===============================
   QUESTIONS ENGINE
================================ */
export async function fetchQuestions() {
  return request("/ai/questions");
}

export async function getNextQuestion(previous_answers: any, industry?: string) {
  return request("/ai/next-question", {
    method: "POST",
    body: JSON.stringify({ previous_answers, industry })
  });
}

/* ===============================
   PIPELINE STATUS & HISTORY
================================ */
export async function fetchRuns() {
  // Returns { count, items: PipelineRun[] }
  return request("/pipeline/history");
}

export async function fetchRunStatus(runId: string) {
  return request(`/pipeline/status/${runId}`);
}

/* ===============================
   OBSERVABILITY
================================ */
export async function fetchObservabilityOverview() {
  return request("/observability/overview");
}

export async function fetchObservabilityTimeline() {
  return request("/observability/timeline");
}

/* ===============================
   SESSIONS
   (not implemented in backend yet)
================================ */
export async function fetchSessions() {
  // Placeholder until sessions are implemented
  return [];
}
