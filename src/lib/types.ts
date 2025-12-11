export interface PipelineStatus {
  run_id?: number;
  status?: string;     // "queued", "initializing", etc.
  stage?: string;      // active stage
  message?: string;
  url?: string;        // pipeline log link
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingSession {
  id: string;
  project_name: string;
  status: string;        // "in_progress", "complete", etc.
  created_at: string;
}

export interface DeployRun {
  run_id: number;
  project_name: string;
  status: string;        // running, failed, completed
  stage: string;         // terraform_plan, terraform_apply, etc.
  created_at: string;
}

export interface AiRecommendationRequest {
  goal: string;
  cloud_preference?: string;
  bi_tool?: string;
  budget?: string;
}

export interface AiRecommendationResponse {
  manifest: unknown;
  summary: string;
}
