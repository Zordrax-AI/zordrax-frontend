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

export type BuildResponse = {
  run_id: string;
  status: string;
  message: string;
  package_contract: {
    package_id: string;
    goal: string;
    environment: string;
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

export type PRProposal = {
  repo: string;
  branch_name: string;
  title: string;
  description?: string;
  proposed_files?: string[];
  pr_id?: number | null;
  pr_url?: string | null;
};

export type CreatePRResponse = {
  run_id: string;
  status: string;
  created_by: string;
  created_at: string;
  proposals: PRProposal[];
};

export type FullRunStatus = {
  run_id: string;
  status: string;
  package_id?: string | null;
  goal?: string | null;
  environment?: string | null;
  azure_devops_pipeline_run_id?: number | null;
  azure_devops_pipeline_url?: string | null;
  azure_devops_state?: string | null;
  azure_devops_result?: string | null;
  approval?: Record<string, unknown> | null;
  pr?: {
    run_id?: string;
    status?: string;
    created_by?: string;
    created_at?: string;
    proposals?: PRProposal[];
  } | null;
  package_contract?: Record<string, unknown> | null;
  raw?: Record<string, unknown>;
};

export type RiskScoreResponse = {
  run_id: string;
  score?: number;
  level?: string;
  reasons?: string[];
  deployment_allowed?: boolean;
};

export type DeployDryRunResponse = {
  run_id: string;
  environment: string;
  status: string;
  dry_run: boolean;
  deployment_allowed: boolean;
  actions: string[];
};

export type AIPRResponse = {
  run_id: string;
  status: string;
  repo: string;
  branch_name: string;
  title: string;
  description: string;
  files: Array<Record<string, unknown>>;
  tests: string[];
  pr_id?: number | null;
  pr_url?: string | null;
  safety: Record<string, unknown>;
};

export function buildPlan(params: {
  prompt: string;
  requested_by: string;
  environment: string;
  trigger_pipeline: boolean;
}) {
  const trigger = params.trigger_pipeline ? "true" : "false";

  return requestJson<BuildResponse>(`/orchestrate/build?trigger_pipeline=${trigger}`, {
    method: "POST",
    body: JSON.stringify({
      prompt: params.prompt,
      requested_by: params.requested_by,
      environment: params.environment,
    }),
  });
}

export function approveRun(params: {
  run_id: string;
  approved_by: string;
  decision?: "approved" | "rejected";
  comment?: string;
}) {
  return requestJson<ApprovalResponse>("/orchestrate/approve", {
    method: "POST",
    body: JSON.stringify({
      run_id: params.run_id,
      approved_by: params.approved_by,
      decision: params.decision || "approved",
      comment: params.comment || "Approved from orchestrator cockpit.",
    }),
  });
}

export function createPR(params: { run_id: string; created_by: string }) {
  return requestJson<CreatePRResponse>("/orchestrate/create-pr", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getFullRunStatus(runId: string) {
  return requestJson<FullRunStatus>(`/orchestrate/runs/${runId}/status`);
}

export function riskScore(params: { run_id: string; environment?: string }) {
  return requestJson<RiskScoreResponse>("/orchestrate/risk-score", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function deployDryRun(params: { run_id: string; environment: string }) {
  return requestJson<DeployDryRunResponse>("/orchestrate/deploy-dry-run", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function createAIPR(params: {
  run_id: string;
  repo: string;
  mode: "proposal_only" | "create_pr";
  files: Array<Record<string, unknown>>;
  tests?: string[];
  created_by?: string;
}) {
  return requestJson<AIPRResponse>("/orchestrate/automation/create-ai-pr", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
