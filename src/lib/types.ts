// src/lib/types.ts

// -------------------------
// Pipeline status (single run)
// Backend: GET /pipeline/status/{run_id}
// -------------------------
export interface PipelineStatus {
  run_id: number;
  status: string;            // e.g. "completed", "inProgress"
  stage?: string | null;     // e.g. "terraform_apply"
  url?: string | null;       // Azure DevOps run URL
  message?: string | null;   // optional, for UI
}

// -------------------------
// Pipeline run history
// Backend: GET /pipeline/history
// Sample: { id, state, result, created, url }
// -------------------------
export interface PipelineRun {
  id: number;
  state: string;             // "completed"
  result?: string | null;    // "succeeded" | "failed" | null
  created: string;           // ISO date
  url: string;
}

export interface RunHistoryResponse {
  count: number;
  items: PipelineRun[];
}

// -------------------------
// Observability (frontend-only for now)
// Used by /runs page
// -------------------------
export interface ObservabilityOverview {
  total_runs: number;
  succeeded_runs: number;
  failed_runs: number;
  running_runs: number;
  last_run: PipelineRun | null;
}

export interface ObservabilityPoint {
  timestamp: string;  // ISO
  succeeded: number;
  failed: number;
}

// -------------------------
// Onboarding sessions
// (UI placeholder until backend implements /sessions)
// -------------------------
export interface OnboardingSession {
  id: string;
  project_name: string;
  created_at: string;      // ISO
  status?: string;         // "completed" | "running" | etc.
  summary?: string;
}

// -------------------------
// Dynamic question engine
// Backend: /ai/questions, /ai/next-question
// -------------------------
export type QuestionType = "select" | "text";

export interface OnboardingQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
}

// -------------------------
// AI architecture recommendation
// Backend: POST /ai/recommend-stack
// -------------------------
export interface ArchitectureRecommendation {
  project_name?: string;
  infrastructure: any;
  etl: any;
  governance: any;
  bi: any;
  summary?: string;
}


// =====================================================
// Runs (SSOT onboarding runs)
// Backend: /runs, /runs/{id}, /runs/{id}/events
// =====================================================

export interface RunRow {
  run_id: string;
  title: string;
  mode: "ai" | "manual";
  status: string;        // pending | running | completed | failed
  stage: string;         // e.g. plan | apply | finalize
  created_at: string;    // ISO timestamp
  updated_at: string;    // ISO timestamp
  manifest?: {
    outputs?: TerraformOutputs;
  } | null;
}

// -------------------------
// Run events (append-only log)
// Backend: /runs/{id}/events
// -------------------------
export interface RunEvent {
  event_id: number;
  run_id: string;
  level: "info" | "warning" | "error";
  stage: string;
  status: string;
  message: string;
  created_at: string;
}

// -------------------------
// Terraform outputs (status page)
// -------------------------
export type TerraformOutputValue = {
  value: any;
  sensitive?: boolean;
};

export type TerraformOutputs = Record<string, TerraformOutputValue>;
