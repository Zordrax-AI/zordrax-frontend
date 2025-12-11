const API_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API;

// -----------------------------
// Start onboarding pipeline
// -----------------------------
export async function startOnboarding(payload: any) {
  const res = await fetch(`${API_BASE}/onboarding/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Onboarding failed: ${res.status} - ${text}`);
  }

  return res.json(); // expected: { run_id, status }
}

// -----------------------------
// Get pipeline run status
// -----------------------------
export async function getDeployStatus(runId: string) {
  const res = await fetch(`${API_BASE}/deploy/status/${runId}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Status fetch failed: ${res.status} - ${text}`);
  }

  return res.json(); // expected: { run_id, status, stage, message }
}
