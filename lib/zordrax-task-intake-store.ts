export type ZordraxTaskPriority = "critical" | "high" | "medium" | "low";

export type ZordraxBuildTask = {
  task_id: string;
  title: string;
  objective: string;
  repo: string;
  linked_repos?: string[];
  priority?: ZordraxTaskPriority;
  dependencies?: string[];
  deliverables?: string[];
  acceptance_criteria?: string[];
  agent_execution_mode?: "proposal_only" | "autonomous_pr" | "validation_only";
  human_approval_required?: boolean;
  requested_by?: string;
  environment?: string;
};

export type QueuedBuildTask = ZordraxBuildTask & {
  queue_id: string;
  queue_status: "held" | "selected" | "released" | "failed";
  created_at: string;
  released_at?: string;
  build_id?: string;
  run_id?: string;
  release_status?: string;
  error?: string;
};

const STORAGE_KEY = "zordrax.task_intake.queue.v1";

export function createQueueId() {
  return `zxtask-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function loadTaskQueue(): QueuedBuildTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTaskQueue(tasks: QueuedBuildTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks, null, 2));
}

export function clearTaskQueue() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function normalizeTask(input: Partial<ZordraxBuildTask>): ZordraxBuildTask {
  const title = String(input.title || "").trim();
  const objective = String(input.objective || input.title || "").trim();
  const repo = String(input.repo || "onboarding-repo").trim();

  if (!title) throw new Error("Task missing title.");
  if (!objective) throw new Error("Task missing objective.");
  if (!repo) throw new Error("Task missing repo.");

  return {
    task_id: String(input.task_id || `TASK-${Date.now()}`).trim(),
    title,
    objective,
    repo,
    linked_repos: Array.isArray(input.linked_repos) ? input.linked_repos : [],
    priority: input.priority || "medium",
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    deliverables: Array.isArray(input.deliverables) ? input.deliverables : [],
    acceptance_criteria: Array.isArray(input.acceptance_criteria) ? input.acceptance_criteria : [],
    agent_execution_mode: input.agent_execution_mode || "proposal_only",
    human_approval_required: input.human_approval_required ?? true,
    requested_by: input.requested_by || "founder",
    environment: input.environment || "dev",
  };
}

export function parseTaskInput(raw: string): ZordraxBuildTask[] {
  const text = raw.trim();
  if (!text) return [];
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.map((item) => normalizeTask(item));
}

export function queueTasks(existing: QueuedBuildTask[], tasks: ZordraxBuildTask[]): QueuedBuildTask[] {
  const now = new Date().toISOString();
  const queued = tasks.map((task) => ({
    ...task,
    queue_id: createQueueId(),
    queue_status: "held" as const,
    created_at: now,
  }));
  return [...queued, ...existing];
}
