// src/lib/api.ts
// Legacy compatibility layer: DO NOT use /pipeline/* anymore.
// Keep this file only so old imports don't break builds.
// Prefer importing directly from "@/lib/agent".

import type { ZordraxRun } from "@/lib/agent";
import { listRuns, getRun, getRunStatus } from "@/lib/agent";


// Old type names that existed in your UI
export type PipelineStatus = {
  run_id?: string;
  status?: string;
  stage?: string;
  message?: string;
  url?: string;
};

export type RunHistoryResponse = {
  items: Array<{
    id: string;
    title: string;
    status: string;
    stage: string;
    created_at: number;
  }>;
};

// Replaces /pipeline/history
export async function getRunHistory(): Promise<RunHistoryResponse> {
  const runs = await listRuns(50, 0);
  return {
    items: runs.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      stage: r.stage,
      created_at: r.created_at,
    })),
  };
}

// Replaces /pipeline/status/{id}
export async function getPipelineStatus(runId: string): Promise<PipelineStatus> {
  const r: ZordraxRun = await getRunStatus(runId);
  return {
    run_id: r.id,
    status: r.status,
    stage: r.stage,
  };
}
