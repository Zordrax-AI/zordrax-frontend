const API_BASE =
  process.env.NEXT_PUBLIC_ONBOARDING_API_BASE?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || `Request failed: ${response.status}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function retryValidation(params: { run_id: string; requested_by?: string; reason?: string }) {
  return requestJson("/orchestrate/autonomous/retry-validation", {
    method: "POST",
    body: JSON.stringify({ requested_by: "founder", reason: "Retry validation from cockpit.", ...params }),
  });
}

export function autoRemediate(params: { run_id: string; repo: string; failure_log: string; create_pr?: boolean; rerun_validation?: boolean }) {
  return requestJson("/orchestrate/autonomous/auto-remediate", {
    method: "POST",
    body: JSON.stringify({ created_by: "founder", create_pr: true, rerun_validation: false, ...params }),
  });
}

export function getPipelineStream(runId: string) {
  return requestJson(`/orchestrate/autonomous/pipeline-stream/${runId}`);
}

export function getLiveLLMStatus() {
  return requestJson("/orchestrate/autonomous/llm-provider/live-status");
}

export function coordinateAgents(params: { run_id: string; goal: string; target_repos: string[] }) {
  return requestJson("/orchestrate/autonomous/multi-agent-coordinate", {
    method: "POST",
    body: JSON.stringify({ requested_by: "founder", ...params }),
  });
}

export function recordDeploymentApproval(params: { run_id: string; environment: string; decision?: "approved" | "rejected"; comment?: string }) {
  return requestJson("/orchestrate/autonomous/deployment-approval", {
    method: "POST",
    body: JSON.stringify({ approved_by: "founder", decision: "approved", ...params }),
  });
}

export function planProductionRollout(params: {
  run_id: string;
  environment: string;
  validation_status: string;
  risk_level: string;
  merge_approval: boolean;
  deployment_approval: boolean;
  dry_run: boolean;
}) {
  return requestJson("/orchestrate/autonomous/production-rollout", {
    method: "POST",
    body: JSON.stringify({ requested_by: "founder", ...params }),
  });
}
