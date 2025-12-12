const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

function url(path: string) {
  return `${BASE}/onboarding${path}`;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json();
}

/* ===============================
   SESSION / RUN FETCHERS
================================ */
export async function fetchSessions() {
  return request("/sessions");
}

export async function fetchRuns() {
  return request("/runs");
}

export async function fetchRunStatus(runId: string) {
  return request(`/runs/${runId}`);
}

/* ===============================
   AI RECOMMENDATION
================================ */
export async function aiRecommendStack(goal: string) {
  return request("/ai/recommend", {
    method: "POST",
    body: JSON.stringify({ goal })
  });
}
