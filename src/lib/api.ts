// C:\Users\Zordr\Desktop\frontend-repo\src\lib\api.ts
/* =========================================================
   Zordrax Frontend <-> Onboarding Agent API (SSOT)
   CANONICAL RULE:
   - Browser calls ONLY the Next.js proxy: /api/agent/...
   - Never call the onboarding service directly from the browser
   - Never require browser-side API keys
========================================================= */

export type RecommendRequest = {
  mode: "manual" | "ai";
  industry: string;
  scale: "small" | "medium" | "large";
  cloud: "azure" | "aws" | "gcp";
};

export type ArchitectureRecommendation = {
  source: "ai" | "manual";
  title?: string;
  [k: string]: unknown;
};

export type RecommendationSnapshotCreate = {
  final: Record<string, unknown>;
  ai: Record<string, unknown> | null;
  diff: unknown[];
  source_query: Record<string, unknown>;
};

export type DeployPlanRequest = {
  // Legacy (older backend shapes)
  recommendation_id?: string;

  // ✅ canonical for SSOT deploy
  requirement_set_id?: string;

  name_prefix?: string;
  region?: string;
  environment?: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
};

export type DeployPlanResponse = {
  run_id: string;
  status: string;
  plan_summary: Record<string, unknown>;
  policy_warnings?: string[];
};

export type DeployApplyResponse = {
  run_id: string;
  status: string;
  pipeline_run_id?: number | string;
};

export type RunRow = {
  run_id: string;
  mode: "manual" | "ai" | "deploy";
  title?: string;
  status: string;
  stage: string;
  cancel_requested: boolean;
  created_at: string;
  updated_at: string;

  deploy?: {
    status?: string;
    pipeline_run_id?: number | string;
    region?: string;
    environment?: string;
  };
};

export type RunEvent = {
  id: number;
  run_id: string;
  level: "info" | "warning" | "error";
  stage: string;
  status: string;
  message: string;
  created_at: string;
};

export type InfraOutputsResponse = {
  run_id: string;
  found: boolean;
  status: "succeeded" | "failed" | "running" | string;
  outputs?: Record<string, { type: string; value: unknown; sensitive: boolean }>;
  updated_at?: string;
};

export type RunsListResponse = RunRow[] | { items: RunRow[] } | { runs: RunRow[] };

export class ApiError extends Error {
  status: number;
  url: string;
  body: string;

  constructor(args: { status: number; url: string; body: string; message?: string }) {
    super(args.message ?? `Request failed (${args.status})`);
    this.name = "ApiError";
    this.status = args.status;
    this.url = args.url;
    this.body = args.body;
  }
}

/* =========================================================
   Proxy base (same-origin)
   Everything goes through /api/agent which proxies to the ACA.
========================================================= */

export const AGENT_PROXY_BASE = "/api/agent";

/** Back-compat for older pages (Diagnostics imports API_BASE) */
export const API_BASE = AGENT_PROXY_BASE;


/* =========================================================
   Fetch helper
========================================================= */

async function readErrorBody(res: Response): Promise<string> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      return typeof j === "string" ? j : JSON.stringify(j);
    }
    return await res.text();
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function fetchJson<T>(path: string, opts?: RequestInit & { idempotencyKey?: string }): Promise<T> {
  // Do not double-prefix when caller already includes /api/agent
  const normalizedPath = path.startsWith("/api/agent") ? path.replace(/^\/api\/agent/, "") : path;
  const url = `${API_BASE}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers as Record<string, string> | undefined),
  };

  if (opts?.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiError({
      status: res.status,
      url,
      body,
      message: body || `Request failed: ${res.status} ${res.statusText}`,
    });
  }

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* helper: try primary, fall back on 404 */
async function tryOr404<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 404) {
      return await fallback();
    }
    throw e;
  }
}

/* =========================================================
   Endpoints (all through proxy)
========================================================= */

export async function health(): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>("/health", { method: "GET" });
}

/* ---------- BRD flow (Mozart uses these) ---------- */

export async function brdCreateSession(created_by = "unknown", title?: string): Promise<{ session_id: string }> {
  // backend ignores title if not in model; safe to send
  return fetchJson<{ session_id: string }>("/api/agent/api/brd/sessions", {
    method: "POST",
    body: JSON.stringify({ created_by, title }),
  });
}

export async function brdCreateRequirementSet(args: {
  session_id: string;
  title?: string;
  created_by?: string;
}): Promise<{ id: string; status: string }> {
  return fetchJson<any>("/api/agent/api/brd/requirement-sets", {
    method: "POST",
    body: JSON.stringify({
      session_id: args.session_id,
      title: args.title ?? "Requirement Set",
      created_by: args.created_by ?? "unknown",
    }),
  });
}

export async function brdUpsertConstraints(requirement_set_id: string, body: any): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/agent/api/brd/constraints/${requirement_set_id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function brdUpsertGuardrails(requirement_set_id: string, body: any): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/agent/api/brd/guardrails/${requirement_set_id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function brdSubmit(requirement_set_id: string, actor = "unknown"): Promise<any> {
  return fetchJson<any>(`/api/agent/api/brd/requirement-sets/${requirement_set_id}/submit`, {
    method: "POST",
    body: JSON.stringify({ actor }),
  });
}

export async function brdApprove(requirement_set_id: string, actor = "unknown"): Promise<any> {
  return fetchJson<any>(`/api/agent/api/brd/requirement-sets/${requirement_set_id}/approve`, {
    method: "POST",
    body: JSON.stringify({ actor }),
  });
}

/* ---------- Connections ---------- */

export async function connectionsTest(payload: any): Promise<any> {
  // your proxy already routes /api/agent/connections/test -> backend /connections/test
  return fetchJson<any>("/api/agent/connections/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- Deploy flow ---------- */

export async function deployPlan(req: DeployPlanRequest, idempotencyKey?: string): Promise<DeployPlanResponse> {
  // backend canonical is requirement_set_id; keep legacy field optional for compatibility
  return fetchJson<DeployPlanResponse>("/api/agent/api/deploy/plan", {
    method: "POST",
    body: JSON.stringify(req),
    idempotencyKey,
  });
}

export async function deployApprove(runId: string, idempotencyKey?: string): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/agent/api/deploy/${runId}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
    idempotencyKey,
  });
}

export async function deployApply(runId: string, idempotencyKey?: string): Promise<DeployApplyResponse> {
  return fetchJson<DeployApplyResponse>(`/api/agent/api/deploy/${runId}/apply`, {
    method: "POST",
    body: JSON.stringify({}),
    idempotencyKey,
  });
}

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
  return fetchJson<DeployRefreshResponse>(`/api/agent/api/deploy/${runId}/refresh`, { method: "GET" });
}

/* ---------- Runs + status ---------- */

export async function getRun(runId: string): Promise<RunRow> {
  return fetchJson<RunRow>(`/api/agent/api/runs/${runId}`, { method: "GET" });
}

export async function getRunEvents(runId: string, afterId = 0): Promise<RunEvent[]> {
  const qs = new URLSearchParams();
  if (afterId > 0) qs.set("after_id", String(afterId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchJson<RunEvent[]>(`/api/agent/api/runs/${runId}/events${suffix}`, { method: "GET" });
}

export async function getInfraOutputs(runId: string): Promise<InfraOutputsResponse> {
  return fetchJson<InfraOutputsResponse>(`/api/agent/api/infra/outputs/${runId}`, { method: "GET" });
}

export async function cancelRun(runId: string): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/agent/api/runs/${runId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function listRuns(): Promise<RunRow[]> {
  try {
    const data = await fetchJson<RunsListResponse>("/api/agent/api/runs/", { method: "GET" });
    if (Array.isArray(data)) return data;
    if ("items" in data && Array.isArray((data as any).items)) return (data as any).items;
    if ("runs" in data && Array.isArray((data as any).runs)) return (data as any).runs;
    return [];
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

/* ---------- AI Recommend (legacy) ---------- */

export async function recommendStack(req: RecommendRequest): Promise<ArchitectureRecommendation> {
  return fetchJson<ArchitectureRecommendation>("/api/agent/api/ai/recommend-stack", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function saveRecommendationSnapshot(snapshot: RecommendationSnapshotCreate): Promise<{ id: string }> {
  try {
    return await fetchJson<{ id: string }>("/api/agent/api/recommendations/snapshots", {
      method: "POST",
      body: JSON.stringify(snapshot),
    });
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 404) {
      throw new Error("Snapshots aren’t enabled on the backend yet (/api/recommendations/snapshots not found).");
    }
    throw e;
  }
}

/* =========================================================
   Phase C — Top 3 Recommendations (deterministic)
========================================================= */

export type Top3Option = {
  id: string;
  rank: number;
  title: string;
  summary: string;
  terraform: {
    cloud: string;
    warehouse: string;
    etl: string;
    governance: string;
    enable_bi: boolean;
    bi_tool: string;
    enable_apim: boolean;
  };
  estimated_monthly_cost_eur: number;
  risk_flags: string[];
  rationale: any;
};

export type Top3Response = {
  requirement_set_id: string;
  generated_at: string;
  options: Top3Option[];
};

export async function getTop3Recommendations(requirement_set_id: string): Promise<Top3Response> {
  const qs = `?requirement_set_id=${encodeURIComponent(requirement_set_id)}`;
  return tryOr404(
    () =>
      fetchJson<Top3Response>(`/api/agent/api/recommendations/top3${qs}`, {
        method: "GET",
      }),
    () =>
      fetchJson<Top3Response>(`/api/agent/recommendations/top3${qs}`, {
        method: "GET",
      })
  );
}

export async function selectRecommendation(requirement_set_id: string, option_id: string): Promise<any> {
  const body = JSON.stringify({ requirement_set_id, option_id });
  return tryOr404(
    () =>
      fetchJson(`/api/agent/api/recommendations/select`, {
        method: "POST",
        body,
      }),
    () =>
      fetchJson(`/api/agent/recommendations/select`, {
        method: "POST",
        body,
      })
  );
}
