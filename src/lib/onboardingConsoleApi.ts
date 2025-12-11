// -----------------------------------------------------
// Zordrax Onboarding Console API Wrapper
// Strict TypeScript (no `any`), CI-safe
// -----------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_ONBOARDING_API;

if (!BASE_URL) {
  console.warn("⚠ NEXT_PUBLIC_ONBOARDING_API is NOT set!");
}

// ------------ Shared Types ------------

export type SessionStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "unknown";

export interface BuildRun {
  run_id: string;
  status: SessionStatus | string;
  started_at?: string;
  completed_at?: string;
  details_url?: string;
}

export interface GovernanceIssue {
  id: string;
  type: string;
  dataset: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export type GovernanceSeverity = GovernanceIssue["severity"];

export type ManifestData = Record<string, unknown>;

export interface ManifestPayload {
  merged: ManifestData;
}

export interface SessionSummary {
  session_id: string;
  project_name: string;
  environment: string;
  status: SessionStatus;
  created_at?: string;
}

export interface SessionDetail extends SessionSummary {
  runs?: BuildRun[];
  // backend may return more fields; keep it open for now
  [key: string]: unknown;
}

export interface OnboardingPayload {
  [key: string]: unknown;
}

// ------------ Helper wrapper ------------

async function callAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// -----------------------------------------------------
// Deployment Status
// -----------------------------------------------------
export function getDeployStatus(runId: string): Promise<BuildRun> {
  return callAPI<BuildRun>(`/deploy/status/${runId}`);
}

// -----------------------------------------------------
// Governance Results
// -----------------------------------------------------
export function fetchGovernanceResults(
  sessionId: string
): Promise<GovernanceIssue[]> {
  return callAPI<GovernanceIssue[]>(`/governance/results/${sessionId}`);
}

// -----------------------------------------------------
// Manifest Fetch
// -----------------------------------------------------
export function fetchManifest(sessionId: string): Promise<ManifestData> {
  return callAPI<ManifestData>(`/manifest/${sessionId}`);
}

// -----------------------------------------------------
// Accept Merged Manifest
// -----------------------------------------------------
export function acceptMergedManifest(
  sessionId: string,
  merged: ManifestData
): Promise<ManifestData> {
  return callAPI<ManifestData>(`/manifest/accept/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ merged }),
  });
}

// -----------------------------------------------------
// Retry a Failed Deployment
// -----------------------------------------------------
export function retryDeployment(runId: string): Promise<BuildRun> {
  return callAPI<BuildRun>(`/deploy/retry/${runId}`, {
    method: "POST",
  });
}

// -----------------------------------------------------
// Fetch ALL Sessions (Session History Table)
// -----------------------------------------------------
export function fetchSessions(): Promise<SessionSummary[]> {
  return callAPI<SessionSummary[]>(`/sessions`);
}

// -----------------------------------------------------
// Fetch a Specific Session (useOnboardingSession.ts)
// -----------------------------------------------------
export function fetchSession(sessionId: string): Promise<SessionDetail> {
  return callAPI<SessionDetail>(`/sessions/${sessionId}`);
}

// -----------------------------------------------------
// Start onboarding
// -----------------------------------------------------
export function submitOnboarding(
  payload: OnboardingPayload
): Promise<SessionDetail> {
  return callAPI<SessionDetail>(`/onboarding/start`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
