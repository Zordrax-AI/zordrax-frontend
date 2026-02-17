export interface RequirementSet {
  id: string;
  status: string;
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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

export interface RunStatus {
  run_id: string;
  previous_status?: string;
  current_status: string;
  last_updated?: string;
  outputs?: Record<string, unknown>;
}
