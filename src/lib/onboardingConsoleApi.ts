// -----------------------------------------------------
// Zordrax Onboarding Console API Wrapper
// Everything the UI imports must be defined here.
// -----------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_ONBOARDING_API;

if (!BASE_URL) {
  console.warn("⚠ NEXT_PUBLIC_ONBOARDING_API is NOT set!");
}

// Helper fetch wrapper
async function callAPI(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    console.error(`❌ API Error [${res.status}] calling ${path}`);
    throw new Error(`API request failed: ${path}`);
  }

  return res.json();
}

// -----------------------------------------------------
// Deployment Status
// -----------------------------------------------------
export async function getDeployStatus(runId: string) {
  return callAPI(`/deploy/status/${runId}`);
}

// -----------------------------------------------------
// Governance Results
// -----------------------------------------------------
export async function fetchGovernanceResults(sessionId: string) {
  return callAPI(`/governance/results/${sessionId}`);
}

// -----------------------------------------------------
// Manifest Fetch
// -----------------------------------------------------
export async function fetchManifest(sessionId: string) {
  return callAPI(`/manifest/${sessionId}`);
}

// -----------------------------------------------------
// Accept Merged Manifest (used in merge workflow)
// -----------------------------------------------------
export async function acceptMergedManifest(sessionId: string, merged: any) {
  return callAPI(`/manifest/accept/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ merged }),
  });
}

// -----------------------------------------------------
// Retry a Failed Deployment
// -----------------------------------------------------
export async function retryDeployment(runId: string) {
  return callAPI(`/deploy/retry/${runId}`, {
    method: "POST",
  });
}

// -----------------------------------------------------
// Fetch Onboarding Session History
// -----------------------------------------------------
export async function fetchSessions() {
  return callAPI(`/sessions`);
}

// -----------------------------------------------------
// Start onboarding (if needed by wizard)
// -----------------------------------------------------
export async function submitOnboarding(payload: any) {
  return callAPI(`/onboarding/start`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
