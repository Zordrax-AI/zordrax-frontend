// ---------------------------------------------
// Single pipeline run (from /pipeline/history)
// ---------------------------------------------
export interface PipelineRun {
  id: number;
  state: string;
  result?: string | null;
  created: string;
  url: string;
}

// ---------------------------------------------
// Pipeline run history response
// ---------------------------------------------
export interface RunHistoryResponse {
  count: number;
  items: PipelineRun[];
}

// ---------------------------------------------
// Observability (dashboard cards summary)
// ---------------------------------------------
export interface ObservabilityOverview {
  total_runs: number;
  succeeded_runs: number;
  failed_runs: number;
  running_runs: number;
  last_run: PipelineRun | null;
}

// ---------------------------------------------
// Individual run status (/pipeline/status/:id)
// ---------------------------------------------
export interface PipelineStatus {
  run_id: number;
  status: string;
  stage?: string;
  message?: string;
  url?: string;
}
// ---------------------------------------------
// Placeholder for onboarding sessions
// (backend does not implement this yet)
// ---------------------------------------------
export interface OnboardingSession {
  id: string;
  created_at: string;
  project_name: string;
  status?: string;       // <-- Added status so the UI stops failing
  summary?: string;
}

