export type TaskTableRow = {
  id: string;
  selected: boolean;
  task_id: string;
  title: string;
  objective: string;
  repo: string;
  linked_repos: string;
  priority: "critical" | "high" | "medium" | "low";
  dependencies: string;
  deliverables: string;
  acceptance_criteria: string;
  agent_execution_mode: "proposal_only" | "autonomous_pr" | "validation_only";
  human_approval_required: boolean;
  requested_by: string;
  environment: string;
  status: "draft" | "valid" | "invalid" | "released" | "failed";
  message?: string;
  build_id?: string;
  run_id?: string;
};

export const STORAGE_KEY = "zordrax.task_load.table.v1";

export const FIELD_HELP: Record<string, string> = {
  task_id: "Unique task reference used for audit and dependency tracking. Example: ZA-ONBOARDING-001.",
  title: "Short task name the agents will understand quickly.",
  objective: "Clear outcome the AI agents must deliver.",
  repo: "Primary repo to modify. Example: onboarding-repo or frontend-repo.",
  linked_repos: "Optional related repos, comma-separated.",
  priority: "Execution priority: critical, high, medium, low.",
  dependencies: "Task IDs that must complete first, comma-separated.",
  deliverables: "Outputs expected from the task, separated by semicolon.",
  acceptance_criteria: "Definition of done for QA, separated by semicolon.",
  agent_execution_mode: "proposal_only is safest. validation_only runs validation. autonomous_pr creates a real PR.",
  human_approval_required: "Whether human approval is required before merge/release.",
  requested_by: "Who requested the task.",
  environment: "Target environment. Use dev for AI builds."
};

export function newRow(input: Partial<TaskTableRow> = {}): TaskTableRow {
  return {
    id: input.id || `row-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    selected: input.selected ?? true,
    task_id: input.task_id || `ZA-TASK-${Date.now()}`,
    title: input.title || "",
    objective: input.objective || "",
    repo: input.repo || "onboarding-repo",
    linked_repos: input.linked_repos || "",
    priority: input.priority || "medium",
    dependencies: input.dependencies || "",
    deliverables: input.deliverables || "",
    acceptance_criteria: input.acceptance_criteria || "",
    agent_execution_mode: input.agent_execution_mode || "proposal_only",
    human_approval_required: input.human_approval_required ?? true,
    requested_by: input.requested_by || "founder",
    environment: input.environment || "dev",
    status: input.status || "draft",
    message: input.message,
    build_id: input.build_id,
    run_id: input.run_id,
  };
}

export function exampleRows(): TaskTableRow[] {
  return [
    newRow({
      task_id: "ZA-ONBOARDING-001",
      title: "Build customer requirements capture module",
      objective: "Capture business requirements, source systems, data volume, compliance needs, reporting needs, and cloud preferences.",
      repo: "onboarding-repo",
      linked_repos: "frontend-repo",
      priority: "high",
      deliverables: "FastAPI schema; onboarding endpoint; frontend form; validation rules; unit tests",
      acceptance_criteria: "Customer can submit requirements; run_id is generated; frontend connects to backend; tests pass",
    }),
    newRow({
      task_id: "ZA-REC-001",
      title: "Build architecture recommendation engine",
      objective: "Recommend cloud, warehouse, ETL, BI, governance, sizing, and roadmap based on customer inputs.",
      repo: "onboarding-repo",
      linked_repos: "frontend-repo",
      priority: "high",
      dependencies: "ZA-ONBOARDING-001",
      deliverables: "Recommendation service; API endpoint; tests; UI result panel",
      acceptance_criteria: "API returns recommendations; tests pass; recommendations include cloud warehouse ETL BI governance",
    }),
  ];
}

export function validateRow(row: TaskTableRow): TaskTableRow {
  const errors: string[] = [];
  if (!row.task_id.trim()) errors.push("task_id required");
  if (!row.title.trim()) errors.push("title required");
  if (!row.objective.trim()) errors.push("objective required");
  if (!row.repo.trim()) errors.push("repo required");
  if (!["critical","high","medium","low"].includes(row.priority)) errors.push("priority invalid");
  if (!["proposal_only","autonomous_pr","validation_only"].includes(row.agent_execution_mode)) errors.push("mode invalid");
  return errors.length ? { ...row, status: "invalid", message: errors.join(", ") } : { ...row, status: "valid", message: "Ready" };
}

export function loadRows(): TaskTableRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((x) => newRow(x)) : [];
  } catch { return []; }
}

export function saveRows(rows: TaskTableRow[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows, null, 2));
}

export function clearRows() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

export function splitList(value: string): string[] {
  return value.split(/[;,]/).map((x) => x.trim()).filter(Boolean);
}

function header(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export function rowsFromObjects(objects: Record<string, unknown>[]): TaskTableRow[] {
  return objects.map((obj) => {
    const source: Record<string, unknown> = {};
    Object.entries(obj).forEach(([k, v]) => source[header(k)] = v);
    return newRow({
      task_id: String(source.task_id || source.id || ""),
      title: String(source.title || source.task || ""),
      objective: String(source.objective || source.description || ""),
      repo: String(source.repo || source.repository || "onboarding-repo"),
      linked_repos: String(source.linked_repos || ""),
      priority: (String(source.priority || "medium").toLowerCase() as TaskTableRow["priority"]),
      dependencies: String(source.dependencies || ""),
      deliverables: String(source.deliverables || ""),
      acceptance_criteria: String(source.acceptance_criteria || source.criteria || ""),
      agent_execution_mode: (String(source.agent_execution_mode || source.mode || "proposal_only") as TaskTableRow["agent_execution_mode"]),
      human_approval_required: String(source.human_approval_required ?? "true").toLowerCase() !== "false",
      requested_by: String(source.requested_by || "founder"),
      environment: String(source.environment || "dev"),
    });
  });
}

export function rowsFromDelimitedText(text: string): TaskTableRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map(header);
  const objects = lines.slice(1).map((line) => {
    const values = line.split(delimiter);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => obj[h] = values[i] || "");
    return obj;
  });
  return rowsFromObjects(objects);
}
