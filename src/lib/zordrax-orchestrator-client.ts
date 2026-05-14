export type BuildResponse = {
  run_id: string;
  status: string;
  message: string;
  package_contract: {
    package_id: string;
    goal: string;
    environment: string;
    approval_required: boolean;
    target_repos: string[];
    safety?: Record<string, unknown>;
  };
  azure_devops_pipeline_run_id?: number | null;
  azure_devops_pipeline_url?: string | null;
};

export type ApprovalResponse = {
  run_id: string;
  status: string;
  approved_by: string;
  decision: string;
  comment?: string | null;
  approved_at: string;
};

export type CreatePrResponse = {
  run_id: string;
  status: string;
  created_by: string;
  created_at: string;
  proposals: Array<{
    repo: string;
    branch_name: string;
    title: string;
    description: string;
    proposed_files: string[];
    pr_id?: number | null;
    pr_url?: string | null;
  }>;
};

export type PrStatusResponse = {
  run_id: string;
  pipeline_run_id: number;
  state: string;
  result?: string | null;
  raw?: Record<string, unknown>;
};

export type RiskScoreResponse = {
  risk_score: number;
  risk_level: string;
  reasons: string[];
  recommended_action: string;
};

export type DeployDryRunResponse = {
  run_id: string;
  environment: string;
  status: string;
  deployment_allowed: boolean;
  approval_required: boolean;
  steps: string[];
  warnings: string[];
};

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

  if (!response.ok) {
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function buildPlan(params: {
  prompt: string;
  requested_by: string;
  environment: string;
  triggerPipeline: boolean;
}) {
  return requestJson<BuildResponse>(
    `/orchestrate/build?trigger_pipeline=${params.triggerPipeline}`,
    {
      method: "POST",
      body: JSON.stringify({
        prompt: params.prompt,
        requested_by: params.requested_by,
        environment: params.environment,
        auto_trigger_pipeline: params.triggerPipeline,
      }),
    },
  );
}

export function approveRun(params: {
  run_id: string;
  approved_by: string;
  comment: string;
}) {
  return requestJson<ApprovalResponse>("/orchestrate/approve", {
    method: "POST",
    body: JSON.stringify({
      run_id: params.run_id,
      approved_by: params.approved_by,
      decision: "approved",
      comment: params.comment,
    }),
  });
}

export function createPr(params: { run_id: string; created_by: string }) {
  return requestJson<CreatePrResponse>("/orchestrate/create-pr", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getPrStatus(params: { run_id: string; pipeline_run_id: number }) {
  const search = new URLSearchParams({
    run_id: params.run_id,
    pipeline_run_id: String(params.pipeline_run_id),
  });
  return requestJson<PrStatusResponse>(`/orchestrate/pr-status?${search}`);
}

export function scoreRisk(params: {
  run_id: string;
  environment: string;
  terraform_add: number;
  terraform_change: number;
  terraform_destroy: number;
}) {
  return requestJson<RiskScoreResponse>("/orchestrate/risk-score", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function deployDryRun(params: {
  run_id: string;
  environment: string;
  approved_by: string;
}) {
  return requestJson<DeployDryRunResponse>("/orchestrate/deploy-dry-run", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
