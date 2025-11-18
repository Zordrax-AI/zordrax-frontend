const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options && options.headers),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string") {
        message = body.detail;
      } else if (body && body.message) {
        message = body.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    // no content
    return undefined as unknown as T;
  }

  return (await res.json()) as T;
}

export type SessionStatus = "pending" | "running" | "failed" | "succeeded";

export type SessionSummary = {
  session_id: string;
  created_at: string;
  project_name: string;
  environment: string;
  status: SessionStatus;
  last_run_id?: number;
};

export type GovernanceSeverity = "low" | "medium" | "high";

export type GovernanceIssue = {
  id: string;
  type: "schema" | "null_check" | "reconciliation" | "pii" | "other";
  severity: GovernanceSeverity;
  message: string;
  dataset?: string;
};

export type BuildRunStatus = "queued" | "running" | "failed" | "succeeded";

export type BuildRun = {
  run_id: number | string;
  status: BuildRunStatus;
  started_at?: string;
  completed_at?: string | null;
  details_url?: string | null;
};

export type SessionDetail = SessionSummary & {
  ai_manifest?: any;
  manual_manifest?: any;
  merged_manifest?: any;
  governance_status?: "pending" | "running" | "failed" | "passed";
  governance_issues?: GovernanceIssue[];
  runs?: BuildRun[];
};

export async function fetchSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>("/onboarding/sessions");
}

export async function fetchSession(sessionId: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/onboarding/sessions/${encodeURIComponent(sessionId)}`);
}

export async function fetchManifest(
  sessionId: string,
  source: "ai" | "manual" | "merged"
): Promise<any> {
  return request<any>(
    `/onboarding/sessions/${encodeURIComponent(sessionId)}/manifest?source=${source}`
  );
}

export async function acceptMergedManifest(
  sessionId: string,
  mergedManifest: any
): Promise<{ status: string; message?: string }> {
  return request<{ status: string; message?: string }>(
    `/onboarding/sessions/${encodeURIComponent(sessionId)}/manifest/accept`,
    {
      method: "POST",
      body: JSON.stringify({ manifest: mergedManifest }),
    }
  );
}

export async function fetchGovernanceResults(
  sessionId: string
): Promise<GovernanceIssue[]> {
  return request<GovernanceIssue[]>(
    `/governance/results?session_id=${encodeURIComponent(sessionId)}`
  );
}

export async function retryDeployment(
  sessionId: string
): Promise<{ status: string; message?: string }> {
  return request<{ status: string; message?: string }>(
    `/onboarding/sessions/${encodeURIComponent(sessionId)}/retry`,
    { method: "POST" }
  );
}
