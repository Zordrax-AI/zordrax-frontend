const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;
if (!BASE) console.error("❌ NEXT_PUBLIC_ONBOARDING_API_URL is missing!");

// -------------------------------
// Helpers
// -------------------------------
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
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }

  return res.json();
}

// -------------------------------
// AI Recommendation
// -------------------------------
export async function aiRecommendStack(goal: string) {
  return request("/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify({ answers: { goal } })
  });
}

// -------------------------------
// Dynamic Questions
// -------------------------------
export async function fetchQuestions() {
  return request("/ai/questions");
}

export async function getNextQuestion(previous_answers: any, industry?: string) {
  return request("/ai/next-question", {
    method: "POST",
    body: JSON.stringify({ previous_answers, industry })
  });
}

// -------------------------------
// Pipeline Status & Runs
// -------------------------------
export async function fetchRuns() {
  return request("/pipeline/history");
}

export async function fetchRunStatus(id: string) {
  return request(`/pipeline/status/${id}`);
}

// -------------------------------
// Sessions (NOT IMPLEMENTED ON BACKEND → return empty list)
// -------------------------------
export async function fetchSessions() {
  return [];
}
