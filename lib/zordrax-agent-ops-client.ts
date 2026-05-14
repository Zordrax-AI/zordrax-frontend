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

export function startAgentOps(params: { goal: string; requested_by?: string; environment?: string; target_repo?: string; create_real_pr?: boolean; trigger_validation?: boolean }) {
  return requestJson("/orchestrate/agent-ops/start", {
    method: "POST",
    body: JSON.stringify({ requested_by: "founder", environment: "dev", target_repo: "onboarding-repo", create_real_pr: true, trigger_validation: true, ...params }),
  });
}

export function getAgentOpsRun(opsRunId: string) {
  return requestJson(`/orchestrate/agent-ops/runs/${opsRunId}`);
}

export function ingestValidationLog(params: { ops_run_id: string; log_text: string; source?: string }) {
  return requestJson("/orchestrate/agent-ops/ingest-validation-log", {
    method: "POST",
    body: JSON.stringify({ source: "manual", ...params }),
  });
}

export function autoFixOps(params: { ops_run_id: string; create_pr?: boolean; rerun_validation?: boolean }) {
  return requestJson("/orchestrate/agent-ops/auto-fix", {
    method: "POST",
    body: JSON.stringify({ create_pr: true, rerun_validation: false, ...params }),
  });
}

export function rerunValidationOps(params: { ops_run_id: string; requested_by?: string; reason?: string }) {
  return requestJson("/orchestrate/agent-ops/rerun-validation", {
    method: "POST",
    body: JSON.stringify({ requested_by: "founder", reason: "Rerun validation after auto-fix.", ...params }),
  });
}
