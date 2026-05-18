export const API_BASE =
  process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://zordrax-onboarding-agent.greenground-d9556cdb.uksouth.azurecontainerapps.io";

export type LiveRunStatus = {
  status: string;
  run_id: string;
  task_id: string;
  repo: string;
  branch: string;
  validation_status: string;
  pr_url?: string | null;
  logs: string[];
};

export type StartLiveTaskRequest = {
  task_id: string;
  title: string;
  description: string;
  repo: string;
  mode?: "proposal_only" | "autonomous_pr";
  requested_by?: string;
};

export async function startLiveTask(payload: StartLiveTaskRequest): Promise<LiveRunStatus> {
  const response = await fetch(`${API_BASE}/orchestrate/live-task/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NEXT_PUBLIC_ZORDRAX_API_KEY
        ? { "x-api-key": process.env.NEXT_PUBLIC_ZORDRAX_API_KEY }
        : {}),
    },
    body: JSON.stringify({
      ...payload,
      mode: payload.mode || "autonomous_pr",
      requested_by: payload.requested_by || "founder",
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.detail || body?.message || `Live execution start failed with HTTP ${response.status}`);
  }

  return body as LiveRunStatus;
}

export async function getLiveTaskStatus(runId: string): Promise<LiveRunStatus> {
  const response = await fetch(`${API_BASE}/orchestrate/live-task/status/${runId}`, {
    method: "GET",
    headers: {
      ...(process.env.NEXT_PUBLIC_ZORDRAX_API_KEY
        ? { "x-api-key": process.env.NEXT_PUBLIC_ZORDRAX_API_KEY }
        : {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.detail || body?.message || `Live status failed with HTTP ${response.status}`);
  }

  return body as LiveRunStatus;
}
