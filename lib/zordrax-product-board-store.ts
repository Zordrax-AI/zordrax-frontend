export type WorkItemType = "Epic" | "Feature" | "Story" | "Task";
export type WorkItemStatus = "Draft" | "Ready" | "PushedToDevOps" | "SyncedFromDevOps" | "QueuedForAI" | "ReleasedToAI" | "InProgress" | "PRPending" | "Done" | "Blocked";

export type ProductWorkItem = {
  id: string;
  selected: boolean;
  type: WorkItemType;
  title: string;
  description: string;
  parent_id: string;
  sequence: number;
  repo: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  acceptance_criteria: string;
  deliverables: string;
  dependencies: string;
  ai_execution_mode: "proposal_only" | "validation_only" | "autonomous_pr";
  human_approval_required: boolean;
  devops_work_item_id?: string;
  devops_url?: string;
  ai_build_id?: string;
  ai_run_id?: string;
  pr_url?: string;
  status: WorkItemStatus;
  message?: string;
  created_at: string;
  updated_at: string;
};

export const PRODUCT_BOARD_KEY = "zordrax.product.board.v1";

export const FIELD_HELP: Record<string, string> = {
  type: "Work item type: Epic, Feature, Story, or Task.",
  title: "Short name for the work item.",
  description: "Clear description or user story. For stories, use: As a..., I want..., so that...",
  parent_id: "ID of parent item. Feature parent is Epic. Story parent is Feature. Task parent is Story.",
  sequence: "Build order. Lower numbers are built first.",
  repo: "Repo the AI task should modify, for example onboarding-repo or zordrax-frontend.",
  priority: "Priority used for sequencing and board view.",
  acceptance_criteria: "Definition of done; separated by semicolon.",
  deliverables: "Expected outputs; separated by semicolon.",
  dependencies: "Other item IDs that must be completed first; comma-separated.",
  ai_execution_mode: "proposal_only is safest. validation_only triggers validation. autonomous_pr creates a real PR.",
  human_approval_required: "Whether human must approve PR/release."
};

export function nowIso(){ return new Date().toISOString(); }
export function createId(type: WorkItemType){
  const p = type === "Epic" ? "EPIC" : type === "Feature" ? "FEAT" : type === "Story" ? "STORY" : "TASK";
  return `ZA-${p}-${Date.now()}-${Math.random().toString(16).slice(2,6)}`;
}

export function newWorkItem(input: Partial<ProductWorkItem> = {}): ProductWorkItem {
  const type = input.type || "Task";
  const now = nowIso();
  return {
    id: input.id || createId(type),
    selected: input.selected ?? true,
    type,
    title: input.title || "",
    description: input.description || "",
    parent_id: input.parent_id || "",
    sequence: Number(input.sequence || 1),
    repo: input.repo || "onboarding-repo",
    priority: input.priority || "Medium",
    acceptance_criteria: input.acceptance_criteria || "",
    deliverables: input.deliverables || "",
    dependencies: input.dependencies || "",
    ai_execution_mode: input.ai_execution_mode || "proposal_only",
    human_approval_required: input.human_approval_required ?? true,
    devops_work_item_id: input.devops_work_item_id,
    devops_url: input.devops_url,
    ai_build_id: input.ai_build_id,
    ai_run_id: input.ai_run_id,
    pr_url: input.pr_url,
    status: input.status || "Draft",
    message: input.message,
    created_at: input.created_at || now,
    updated_at: input.updated_at || now
  };
}

export function exampleProgram(): ProductWorkItem[] {
  const epic = newWorkItem({id:"ZA-EPIC-ONB-001",type:"Epic",title:"Customer Onboarding Platform",description:"Create customer onboarding for requirements, source systems, governance needs, and reporting goals.",repo:"onboarding-repo",priority:"Critical",sequence:1,status:"Ready"});
  const feature = newWorkItem({id:"ZA-FEAT-ONB-001",type:"Feature",title:"Requirements Capture",description:"Allow customers to submit business and technical requirements.",parent_id:epic.id,repo:"onboarding-repo",priority:"Critical",sequence:2,status:"Ready"});
  const story = newWorkItem({id:"ZA-STORY-ONB-001",type:"Story",title:"Customer enters onboarding requirements",description:"As a customer, I want to enter source systems, reporting needs, compliance needs, and cloud preferences so that Zordrax can recommend a target architecture.",parent_id:feature.id,repo:"onboarding-repo",priority:"High",sequence:3,status:"Ready"});
  const task1 = newWorkItem({id:"ZA-TASK-ONB-001",type:"Task",title:"Build onboarding requirements schema and API",description:"Create backend schema, validation, POST endpoint, GET endpoint, and unit tests.",parent_id:story.id,repo:"onboarding-repo",priority:"High",sequence:4,deliverables:"FastAPI schema; POST endpoint; GET endpoint; unit tests",acceptance_criteria:"Requirements can be submitted; run_id is generated; tests pass",status:"Ready"});
  const task2 = newWorkItem({id:"ZA-TASK-ONB-002",type:"Task",title:"Build onboarding requirements frontend form",description:"Create the customer-facing requirements form and connect it to backend.",parent_id:story.id,repo:"zordrax-frontend",priority:"High",sequence:5,dependencies:task1.id,deliverables:"Next.js form; API client; validation messages",acceptance_criteria:"User can submit form; backend receives payload; UI shows success state",status:"Ready"});
  return [epic, feature, story, task1, task2];
}

export function loadBoard(): ProductWorkItem[] {
  if (typeof window === "undefined") return [];
  try { const raw = window.localStorage.getItem(PRODUCT_BOARD_KEY); if(!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed.map((x)=>newWorkItem(x)) : []; } catch { return []; }
}
export function saveBoard(items: ProductWorkItem[]) { if (typeof window !== "undefined") window.localStorage.setItem(PRODUCT_BOARD_KEY, JSON.stringify(items, null, 2)); }
export function clearBoard() { if (typeof window !== "undefined") window.localStorage.removeItem(PRODUCT_BOARD_KEY); }

export function validateItem(item: ProductWorkItem): ProductWorkItem {
  const errors: string[] = [];
  if (!item.title.trim()) errors.push("title required");
  if (!item.description.trim()) errors.push("description required");
  if (item.type !== "Epic" && !item.parent_id.trim()) errors.push("parent_id required");
  if (item.type === "Task" && !item.repo.trim()) errors.push("repo required");
  return { ...item, status: errors.length ? "Blocked" : "Ready", message: errors.join(", ") || "Ready", updated_at: nowIso() };
}

function h(x:string){ return x.trim().toLowerCase().replace(/\s+/g, "_"); }
export function rowsFromObjects(objects: Record<string, unknown>[]): ProductWorkItem[] {
  return objects.map((obj)=>{
    const s: Record<string, unknown> = {};
    Object.entries(obj).forEach(([k,v]) => s[h(k)] = v);
    return newWorkItem({
      id:String(s.id || s.work_item_id || ""),
      type:String(s.type || "Task") as WorkItemType,
      title:String(s.title || ""),
      description:String(s.description || s.user_story || ""),
      parent_id:String(s.parent_id || s.parent || ""),
      sequence:Number(s.sequence || s.order || 1),
      repo:String(s.repo || s.repository || "onboarding-repo"),
      priority:String(s.priority || "Medium") as ProductWorkItem["priority"],
      acceptance_criteria:String(s.acceptance_criteria || s.criteria || ""),
      deliverables:String(s.deliverables || ""),
      dependencies:String(s.dependencies || ""),
      ai_execution_mode:String(s.ai_execution_mode || s.agent_execution_mode || "proposal_only") as ProductWorkItem["ai_execution_mode"],
      human_approval_required:String(s.human_approval_required ?? "true").toLowerCase() !== "false",
      devops_work_item_id: s.devops_work_item_id ? String(s.devops_work_item_id) : undefined,
      devops_url: s.devops_url ? String(s.devops_url) : undefined,
      status:String(s.status || "Draft") as WorkItemStatus
    });
  });
}
export function rowsFromDelimitedText(text: string): ProductWorkItem[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map(h);
  const objects = lines.slice(1).map((line)=>{
    const values = line.split(delimiter);
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index)=>obj[header]=values[index] || "");
    return obj;
  });
  return rowsFromObjects(objects);
}
export function splitList(value: string): string[] { return value.split(/[;,]/).map((x)=>x.trim()).filter(Boolean); }
