import { loadBoard, ProductWorkItem } from "./zordrax-product-board-store";

export type ExecutionTask = ProductWorkItem & {
  blocked_by: string[];
  queue_position: number;
  agent: string;
  confidence: number;
  sandbox: string;
  pipeline_status: "not_started" | "running" | "passed" | "failed" | "blocked";
  pr_provider: "github" | "azure_devops" | "none";
  pr_status: "none" | "draft" | "open" | "approved" | "merged" | "rejected";
};

export function toExecutionTasks(): ExecutionTask[] {
  const items = loadBoard().filter((x) => x.type === "Task");
  return items.sort((a, b) => a.sequence - b.sequence).map((item, index) => {
    const deps = item.dependencies ? item.dependencies.split(/[;,]/).map((x) => x.trim()).filter(Boolean) : [];
    const isFrontend = item.repo.includes("frontend") || item.repo.includes("zordrax-frontend");
    const released = item.status === "ReleasedToAI";
    const blocked = deps.length > 0 && item.status !== "Done";

    return {
      ...item,
      blocked_by: deps,
      queue_position: index + 1,
      agent: isFrontend ? "FrontendBuilderAgent" : "BackendBuilderAgent",
      confidence: released ? 72 : blocked ? 40 : 58,
      sandbox: released ? `sandbox-${item.id.toLowerCase().replaceAll("_", "-")}` : "not_allocated",
      pipeline_status: item.status === "Done" ? "passed" : blocked ? "blocked" : released ? "running" : "not_started",
      pr_provider: isFrontend ? "github" : "azure_devops",
      pr_status: item.status === "PRPending" ? "open" : item.status === "Done" ? "merged" : "none",
    };
  });
}

export function summary(tasks: ExecutionTask[]) {
  return {
    total: tasks.length,
    blocked: tasks.filter((x) => x.pipeline_status === "blocked").length,
    running: tasks.filter((x) => x.pipeline_status === "running").length,
    prs: tasks.filter((x) => x.pr_status === "open").length,
    merged: tasks.filter((x) => x.pr_status === "merged").length,
    avgConfidence: tasks.length ? Math.round(tasks.reduce((a, b) => a + b.confidence, 0) / tasks.length) : 0,
  };
}

export const phaseBCards = [
  { title: "Dependency Graph", href: "/execution/dependencies", desc: "See blocked tasks and upstream dependencies.", phase: "B" },
  { title: "Execution Queue", href: "/execution/queue", desc: "View task order, agents, sandboxes and run states.", phase: "B" },
  { title: "PR Links", href: "/execution/prs", desc: "Track GitHub and Azure DevOps PRs.", phase: "B" },
  { title: "Live Pipeline Status", href: "/execution/pipelines", desc: "Monitor validation and deployment state.", phase: "B" },
  { title: "Multi-Agent Swarm", href: "/swarm", desc: "Coordinate planner, coder, QA and remediation agents.", phase: "C" },
  { title: "Sandboxed Workers", href: "/swarm/sandboxes", desc: "View isolated execution containers.", phase: "C" },
  { title: "Auto-Remediation", href: "/swarm/remediation", desc: "Track failure fixes and retry loops.", phase: "C" },
  { title: "Confidence Scoring", href: "/swarm/confidence", desc: "Review merge confidence before approval.", phase: "C" },
  { title: "Merge Automation", href: "/swarm/merge", desc: "Controlled human-approved merge flow.", phase: "C" },
];
