// src/types/onboarding.ts

// ---------- Onboarding Q&A ----------

export interface OnboardingQuestion {
  id: string;
  text: string;
  type: "single" | "multi" | "text";
  options?: string[];
}

export interface OnboardingAnswers {
  answers: Record<string, string>;
}

// ---------- Architecture + Manifest ----------

export interface InfrastructureSpec {
  [key: string]: unknown;
}

export interface EtlSpec {
  tool: string;
  [key: string]: unknown;
}

export interface GovernanceSpec {
  rules: string[];
}

export interface BiSpec {
  tool: string;
  model?: string;
  kpis?: string[];
}

export interface ArchitectureRecommendation {
  // frontend-only metadata (backend ignores extras)
  project_name?: string;
  description?: string;

  infrastructure: InfrastructureSpec;
  etl: EtlSpec;
  governance: GovernanceSpec;
  bi: BiSpec;
}

// ---------- Deployment ----------

export interface DeployPipelineInfo {
  id?: number;
  url?: string;
}

export interface DeployResponse {
  status?: string;
  pipeline_run?: DeployPipelineInfo;
  error?: string;
}
