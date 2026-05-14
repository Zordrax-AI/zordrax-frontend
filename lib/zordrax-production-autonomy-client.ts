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

export function startProductionAutonomy(params: {
  goal: string;
  repo?: string;
  requested_by?: string;
  environment?: string;
  create_real_pr?: boolean;
  trigger_validation?: boolean;
}) {
  return requestJson("/orchestrate/production-autonomy/start", {
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

export function watchProductionValidation(params: { autonomy_id: string; pipeline_run_id?: number }) {
  return requestJson("/orchestrate/production-autonomy/watch-validation", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function autoFixUntilGreen(params: {
  autonomy_id: string;
  max_attempts?: number;
  create_real_fix_pr?: boolean;
  rerun_validation?: boolean;
}) {
  return requestJson("/orchestrate/production-autonomy/auto-fix-until-green", {
    method: "POST",
    body: JSON.stringify({
      max_attempts: 3,
      create_real_fix_pr: true,
      rerun_validation: true,
      ...params,
    }),
  });
}

export function approveProductionMerge(params: {
  autonomy_id: string;
  approved_by?: string;
  approve_merge?: boolean;
  comment?: string;
}) {
  return requestJson("/orchestrate/production-autonomy/approve-merge", {
    method: "POST",
    body: JSON.stringify({
      approved_by: "founder",
      approve_merge: true,
      ...params,
    }),
  });
}

export function deployProductionAutonomy(params: {
  autonomy_id: string;
  environment?: string;
  approved_by?: string;
  approve_deploy?: boolean;
}) {
  return requestJson("/orchestrate/production-autonomy/deploy", {
    method: "POST",
    body: JSON.stringify({
      environment: "dev",
      approved_by: "founder",
      approve_deploy: true,
      ...params,
    }),
  });
}

export function promoteProductionAutonomy(params: {
  autonomy_id: string;
  target_environment: string;
  approved_by?: string;
  approval?: boolean;
}) {
  return requestJson("/orchestrate/production-autonomy/promote", {
    method: "POST",
    body: JSON.stringify({
      approved_by: "founder",
      approval: false,
      ...params,
    }),
  });
}
