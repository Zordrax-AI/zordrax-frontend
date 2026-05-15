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

export type Phase2SwarmState = {
  swarm_id: string;
  goal: string;
  requested_by: string;
  environment: string;
  stage: string;
  status: string;
  target_repos: string[];
  work_items: Array<{
    id: string;
    repo: string;
    branch_name: string;
    agent: string;
    task: string;
    status: string;
    sandbox_id?: string | null;
    pr_id?: number | null;
    pr_url?: string | null;
    confidence_score?: number | null;
    details?: Record<string, unknown>;
  }>;
  events: Array<{
    timestamp: string;
    agent: string;
    repo?: string | null;
    stage: string;
    status: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
  live_stream: string[];
  memory_nodes: Array<Record<string, unknown>>;
  merge_confidence: Record<string, unknown>;
  artifacts: Record<string, unknown>;
};

export function startPhase2Swarm(params: {
  goal: string;
  requested_by?: string;
  target_repos?: string[];
  environment?: string;
  create_real_prs?: boolean;
  run_sandboxes?: boolean;
  max_depth?: number;
  max_workers?: number;
}) {
  return requestJson<Phase2SwarmState>("/orchestrate/swarm/phase2/start", {
    method: "POST",
    body: JSON.stringify({
      requested_by: "founder",
      target_repos: ["onboarding-repo", "frontend-repo"],
      environment: "dev",
      create_real_prs: false,
      run_sandboxes: true,
      max_depth: 2,
      max_workers: 4,
      ...params,
    }),
  });
}

export function continuePhase2Swarm(params: {
  swarm_id: string;
  failure_log?: string;
  rerun_sandboxes?: boolean;
  create_fix_prs?: boolean;
}) {
  return requestJson<Phase2SwarmState>("/orchestrate/swarm/phase2/continue", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getPhase2SwarmStatus(swarmId: string) {
  return requestJson<Phase2SwarmState>(`/orchestrate/swarm/phase2/status/${swarmId}`);
}

export function getPhase2SwarmStream(swarmId: string) {
  return requestJson<{
    swarm_id: string;
    status: string;
    stage: string;
    live_stream: string[];
    events: Phase2SwarmState["events"];
    merge_confidence: Record<string, unknown>;
  }>(`/orchestrate/swarm/phase2/stream/${swarmId}`);
}
