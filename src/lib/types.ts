export interface RequirementSet {
  id: string;
  status: string;
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  connector_id?: string;
}

export interface Connector {
  id: string;
  type: string;
  name: string;
  status?: string;
  host?: string;
  account?: string;
  database?: string;
  schema?: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  message?: string;
  latency_ms?: number;
}

export interface TableInfo {
  schema?: string;
  name: string;
  row_estimate?: number;
  size_bytes_estimate?: number;
  pii_flags?: string[];
}

export interface ProfilingSummary {
  totals: {
    tables: number;
    rows_estimate?: number;
    size_bytes_estimate?: number;
  };
  biggest_tables: TableInfo[];
  pii_summary?: {
    flagged_tables: number;
    flags?: Record<string, number>;
  };
  refresh_plan?: string;
  ingestion_recommendation?: string;
}

export interface DeployPlanResponse {
  run_id: string;
  status: string;
  plan_summary?: string;
  policy_warnings?: string[];
}

export interface DeployPlanRequest {
  requirement_set_id?: string;
  connector_id?: string;
  recommendation_id?: string;
  name_prefix: string;
  region: string;
  environment: string;
  enable_apim: boolean;
  backend_app_hostname: string;
}

export interface RecommendRequest {
  requirement_set_id: string;
  mode?: string;
  industry?: string;
  scale?: string;
  cloud?: string;
  context?: Record<string, unknown>;
}

export interface InfraOutputsResponse {
  run_id: string;
  outputs?: Record<string, unknown>;
  status?: string;
  found?: boolean;
}

export interface RunEvent {
  id: number;
  run_id: string;
  level?: string;
  stage?: string;
  status?: string;
  message?: string;
  created_at?: string;
}

export interface RunStatus {
  run_id: string;
  previous_status?: string;
  current_status: string;
  last_updated?: string;
  outputs?: Record<string, unknown>;
  pipeline?: { url?: string; state?: string; result?: string };
}

export interface RunRow {
  run_id: string;
  status: string;
  requirement_set_id?: string;
  connector_id?: string;
  created_at?: string;
  updated_at?: string;
  mode?: string;
  stage?: string;
  title?: string;
}

export interface Constraints {
  selected_tables?: string[];
  metrics_intent?: any;
  [key: string]: any;
}

export interface Top3Option {
  key: string;
  title: string;
  description?: string;
}
