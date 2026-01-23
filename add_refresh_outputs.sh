#!/usr/bin/env bash
set -euo pipefail

FILE="src/lib/api.ts"
grep -q "export async function deployRefresh" "$FILE" && echo "deployRefresh already exists" || cat >> "$FILE" <<'EOF'

export type DeployRefreshResponse = {
  run_id: string;
  previous_status: string;
  current_status: string;
  changed: boolean;
  pipeline: {
    pipeline_id: number;
    pipeline_run_id: number;
    state: string;
    result?: string | null;
    url?: string | null;
  };
};

export async function deployRefresh(runId: string): Promise<DeployRefreshResponse> {
  return fetchJson<DeployRefreshResponse>(`/api/deploy/${runId}/refresh`, { method: "GET" });
}

export async function getInfraOutputs(runId: string): Promise<any> {
  return fetchJson<any>(`/api/infra/outputs/${runId}`, { method: "GET" });
}
EOF
echo "Done."
