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

export function startPRValidationLoop(params: {
  goal: string;
  repo?: string;
  requested_by?: string;
  environment?: string;
  create_real_pr?: boolean;
  trigger_validation?: boolean;
}) {
  return requestJson("/orchestrate/pr-validation-loop/start", {
    method: "POST",
    body: JSON.stringify({
      repo: "onboarding-repo",
      requested_by: "founder",
      environment: "dev",
      create_real_pr: true,
      trigger_validation: true,
      ...params,
    }),
  });
}

export function ingestPRLoopLogs(params: { loop_id: string; log_text?: string; source?: string }) {
  return requestJson("/orchestrate/pr-validation-loop/ingest-logs", {
    method: "POST",
    body: JSON.stringify({ source: "manual", ...params }),
  });
}

export function autoFixPRLoop(params: { loop_id: string; create_real_fix_pr?: boolean }) {
  return requestJson("/orchestrate/pr-validation-loop/auto-fix", {
    method: "POST",
    body: JSON.stringify({ create_real_fix_pr: true, ...params }),
  });
}

export function rerunPRLoop(params: { loop_id: string; requested_by?: string }) {
  return requestJson("/orchestrate/pr-validation-loop/rerun", {
    method: "POST",
    body: JSON.stringify({ requested_by: "founder", ...params }),
  });
}

export function approvePRLoop(params: {
  loop_id: string;
  approved_by?: string;
  approve_merge?: boolean;
  approve_dev_deploy?: boolean;
  comment?: string;
}) {
  return requestJson("/orchestrate/pr-validation-loop/approve", {
    method: "POST",
    body: JSON.stringify({
      approved_by: "founder",
      approve_merge: true,
      approve_dev_deploy: true,
      ...params,
    }),
  });
}

export function getPRLoop(loopId: string) {
  return requestJson(`/orchestrate/pr-validation-loop/runs/${loopId}`);
}
