// ---------------------------------------------
// Zordrax Onboarding Console API Wrapper
// All calls to the backend are defined here.
// ---------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_ONBOARDING_API;

if (!BASE_URL) {
  console.warn("⚠ NEXT_PUBLIC_ONBOARDING_API is NOT configured!");
}

// --------------------------------------------------
// Fetch deployment status
// --------------------------------------------------
export async function getDeployStatus(runId: string) {
  const res = await fetch(`${BASE_URL}/deploy/status/${runId}`);
  if (!res.ok) throw new Error("Failed to fetch deploy status");
  return res.json();
}

// --------------------------------------------------
// Fetch governance validation results
// --------------------------------------------------
export async function fetchGovernanceResults(sessionId: string) {
  const res = await fetch(`${BASE_URL}/governance/results/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch governance results");
  return res.json();
}

// --------------------------------------------------
// Fetch manifest (AI-selected infrastructure options)
// --------------------------------------------------
export async function fetchManifest(sessionId: string) {
  const res = await fetch(`${BASE_URL}/manifest/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch manifest");
  return res.json();
}

// --------------------------------------------------
// (Optional) Submit onboarding choices
// --------------------------------------------------
export async function submitOnboarding(payload: any) {
  const res = await fetch(`${BASE_URL}/onboarding/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to start onboarding");
  return res.json();
}
