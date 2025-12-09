export interface Infrastructure {
  azure: Record<string, boolean>;
}

export interface EtlConfig {
  tool: string;
}

export interface GovernanceConfig {
  rules: string;
}

export interface BiConfig {
  tool: string;
}

export interface Architecture {
  infrastructure: Infrastructure;
  etl: EtlConfig;
  governance: GovernanceConfig;
  bi: BiConfig;
}

export interface Manifest {
  infrastructure: Infrastructure;
  etl: EtlConfig;
  governance: GovernanceConfig;
  bi: BiConfig;
}

export interface DeployResponse {
  pipeline_run?: {
    id?: number;
    url?: string;
  };
  status?: string;
  project_name?: string;
  error?: string;
}
