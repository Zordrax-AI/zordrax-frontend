// src/lib/deploy.ts
import { zaFetch as fetchJson } from "./za";


export type DeployPackageResponse = {
  run_id: string;
  current_status: string;
  run: any;
  deploy: any;
  package: any | null;
  infra: any | null;
  events: any[];
};

export async function deployGetPackage(runId: string): Promise<DeployPackageResponse> {
  return fetchJson<DeployPackageResponse>(`/api/agent/api/deploy/${runId}/package`, {
    method: "GET",
  });
}

export async function deployApprove(runId: string): Promise<{ ok: boolean; run_id: string; status: string; pipeline_run_id: number }> {
  return fetchJson(`/api/agent/api/deploy/${runId}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function deployRefresh(runId: string): Promise<any> {
  // ✅ backend is GET
  return fetchJson(`/api/agent/api/deploy/${runId}/refresh`, {
    method: "GET",
  });
}

export async function deployOutputs(runId: string): Promise<any> {
  return fetchJson(`/api/agent/api/deploy/${runId}/outputs`, {
    method: "GET",
  });
}
