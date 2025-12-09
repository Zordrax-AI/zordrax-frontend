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
  project_name?: string;
  description?: string;

  infrastructure: InfrastructureSpec;
  etl: EtlSpec;
  governance: GovernanceSpec;
  bi: BiSpec;
}

export interface DeployPipelineInfo {
  id?: number;
  url?: string;
}

export interface DeployResponse {
  status?: string;
  pipeline_run?: DeployPipelineInfo;
  error?: string;
}
