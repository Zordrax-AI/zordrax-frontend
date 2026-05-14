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

export function startExecutionLoop(params: {
  goal: string;
  requested_by?: string;
  environment?: string;
  target_repo?: string;
  create_real_pr?: boolean;
  trigger_validation?: boolean;
}) {
  return requestJson("/orchestrate/execution/start", {
    method: "POST",
    body: JSON.stringify({
      requested_by: "founder",
      environment: "dev",
      target_repo: "onboarding-repo",
      create_real_pr: true,
      trigger_validation: false,
      ...params,
    }),
  });
}

export function continueExecutionLoop(params: {
  execution_id: string;
  failure_log?: string;
  trigger_validation_retry?: boolean;
}) {
  return requestJson("/orchestrate/execution/continue", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function approveExecutionLoop(params: {
  execution_id: string;
  approved_by?: string;
  decision?: string;
  comment?: string;
}) {
  return requestJson("/orchestrate/execution/approve", {
    method: "POST",
    body: JSON.stringify({
      approved_by: "founder",
      decision: "approved",
      ...params,
    }),
  });
}

export function getExecutionLoop(executionId: string) {
  return requestJson(`/orchestrate/execution/runs/${executionId}`);
}
