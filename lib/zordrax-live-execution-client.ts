import type { ProductWorkItem } from "./zordrax-product-board-store";

const API_BASE =
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

export type LiveExecutionResult = {
  status: string;
  run_id: string;
  task_id: string;
  repo: string;
  branch: string;
  validation_status: string;
  pr_url?: string;
  logs: string[];
};

export async function executeLiveTask(item: ProductWorkItem): Promise<LiveExecutionResult> {
  if (item.type !== "Task") {
    throw new Error("Only Task items can be released to AI execution.");
  }

  const response = await fetch(`${API_BASE}/orchestrate/live-task/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NEXT_PUBLIC_ZORDRAX_API_KEY
        ? { "x-api-key": process.env.NEXT_PUBLIC_ZORDRAX_API_KEY }
        : {}),
    },
    body: JSON.stringify({
      task_id: item.id,
      title: item.title,
      description: item.description,
      repo: item.repo,
      mode: item.ai_execution_mode === "proposal_only" ? "proposal_only" : "autonomous_pr",
      requested_by: "founder",
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.detail || body?.message || `Live execution failed with HTTP ${response.status}`);
  }

  return body as LiveExecutionResult;
}
