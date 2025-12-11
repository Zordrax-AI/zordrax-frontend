// src/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

if (!BASE_URL) {
  console.warn("❗ NEXT_PUBLIC_ONBOARDING_API_URL is NOT set!");
}

/**
 * Generic request wrapper for all backend calls.
 */
export async function request(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  return res.json();
}

/* --------------------------------------------------
   AI Recommendation (POST /ai/recommend)
-------------------------------------------------- */
export async function aiRecommendStack(goal: string) {
  return request("/ai/recommend", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

/* --------------------------------------------------
   Sessions (GET /sessions)
-------------------------------------------------- */
export async function fetchSessions() {
  return request("/sessions", { method: "GET" });
}

/* --------------------------------------------------
   Runs (GET /runs)
-------------------------------------------------- */
export async function fetchRuns() {
  return request("/runs", { method: "GET" });
}

/* --------------------------------------------------
   Run Status (GET /runs/{runId})
-------------------------------------------------- */
export async function fetchRunStatus(runId: string) {
  return request(`/runs/${runId}`, { method: "GET" });
}
