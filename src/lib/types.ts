export type RequirementSet = {
  id: string;
  session_id?: string;
  version?: number;
  status?: string;
  title?: string;
  requirement_set_id?: string;
  [key: string]: any;
};

export type DeployPlanResponse = {
  run_id: string;
  status: string;
  plan_summary?: string;
  policy_warnings?: string[];
  [key: string]: any;
};

export type DeployPackageResponse = {
  package_id?: string;
  requirement_set_id?: string;
  requirement_set_version?: number;
  manifest_json?: any;
  [key: string]: any;
};

export type DeployRefreshResponse = {
  previous_status?: string;
  current_status?: string;
  pipeline?: {
    state?: string;
    result?: string;
    url?: string;
  };
  [key: string]: any;
};
