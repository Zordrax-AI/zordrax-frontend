import { ProductWorkItem, splitList } from "./zordrax-product-board-store";
import { startAIBuild } from "./zordrax-ai-build-client";

const API_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Request failed: ${response.status}`);
  return text ? JSON.parse(text) as T : {} as T;
}

export async function pushItemsToDevOps(items: ProductWorkItem[]) {
  return requestJson<{status:string;items:Array<{id:string;devops_work_item_id?:string;devops_url?:string;status:string;message?:string}>}>("/orchestrate/product-board/devops/push", { method:"POST", body: JSON.stringify({items}) });
}

export async function syncItemsFromDevOps() {
  return requestJson<{status:string;items:ProductWorkItem[]}>("/orchestrate/product-board/devops/sync");
}

export async function getProductBoardStatus() {
  return requestJson<{status:string;summary:Record<string,number>;items:ProductWorkItem[]}>("/orchestrate/product-board/status");
}

export async function getPendingApprovals() {
  return requestJson<{status:string;approvals:Array<{id:string;title:string;repo:string;pr_url?:string;devops_url?:string;status:string;requested_by?:string}>}>("/orchestrate/product-board/approvals");
}

export async function releaseItemToAI(item: ProductWorkItem) {
  if (item.type !== "Task") throw new Error("Only Task items can be released to the AI Orchestrator.");
  return startAIBuild({
    task: `${item.title}\n\nDescription:\n${item.description}\n\nDeliverables:\n${splitList(item.deliverables).map((x)=>`- ${x}`).join("\n")}\n\nAcceptance Criteria:\n${splitList(item.acceptance_criteria).map((x)=>`- ${x}`).join("\n")}\n\nParent:\n${item.parent_id}\n\nDependencies:\n${item.dependencies}`,
    repo: item.repo,
    requested_by: "founder",
    environment: "dev",
    create_real_pr: item.ai_execution_mode === "autonomous_pr",
    trigger_validation: item.ai_execution_mode !== "proposal_only"
  });
}
