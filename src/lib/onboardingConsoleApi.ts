// -----------------------------------------------------
// Zordrax Onboarding Console API Wrapper
// Strict TypeScript (no "any"), CI-safe
// -----------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_ONBOARDING_API;

if (!BASE_URL) {
  console.warn("⚠ NEXT_PUBLIC_ONBOARDING_API is NOT set!");
}

// ------------ Shared Types ------------
export interface ManifestPayload {
  merged: Record<string, unknown>;
}

export interface OnboardingPayload {
  [key: string]: unknown;
}

export interface Session {
  id: string;
  status: string;
  created_at: string;
}

// ------------ Helper wrapper ------------
async function callAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${path}`);
  }

  return res.json() as Promise<T>;
}

// -----------------------------------------------------
// Deployment Status
// -----------------------------------------------------
export function getDeployStatus(runId: string) {
  return callAPI<Record<string, unknown>>(`/deploy/status/${runId}`);
}

// -----------------------------------------------------
// Governance Results
// -----------------------------------------------------
export function fetchGovernanceResults(sessionId: string) {
  return callAPI<Record<string, unknown>>(`/governance/results/${sessionId}`);
}

// -----------------------------------------------------
// Manifest Fetch
// -----------------------------------------------------
export function fetchManifest(sessionId: string) {
  return callAPI<Record<string, unknown>>(`/manifest/${sessionId}`);
}

// -----------------------------------------------------
// Accept Merged Manifest
// -----------------------------------------------------
export function acceptMergedManifest(sessionId: string, merged: ManifestPayload["merged"]) {
  return callAPI<Record<string, unknown>>(`/manifest/accept/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ merged }),
  });
}

// -----------------------------------------------------
// Retry a Failed Deployment
// -----------------------------------------------------
export function retryDeployment(runId: string) {
  return callAPI<Record<string, unknown>>(`/deploy/retry/${runId}`, {
    method: "POST",
  });
}

// -----------------------------------------------------
// Fetch ALL Sessions (Session History Table)
// -----------------------------------------------------
export function fetchSessions() {
  return callAPI<Session[]>(`/sessions`);
}

// -----------------------------------------------------
// Fetch a Specific Session (useOnboardingSession.ts)
// -----------------------------------------------------
export function fetchSession(sessionId: string) {
  return callAPI<Session>(`/sessions/${sessionId}`);
}

// -----------------------------------------------------
// Start onboarding
// -----------------------------------------------------
export function submitOnboarding(payload: OnboardingPayload) {
  return callAPI<Record<string, unknown>>(`/onboarding/start`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
