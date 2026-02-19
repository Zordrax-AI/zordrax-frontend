// src/lib/agent.ts

export const PROXY_BASE = "/api/za"; // IMPORTANT: matches your logs: /api/za/api/...

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOpts = {
  headers?: Record<string, string>;
};

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts: RequestOpts = {}
): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${PROXY_BASE}${p}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        ...(opts.headers || {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `Proxy timeout calling ${PROXY_BASE}${p}`
        : `Proxy network error calling ${PROXY_BASE}${p}: ${e?.message || String(e)}`;
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  if (!res.ok) {
    // Try to show backend detail cleanly
    try {
      const j = JSON.parse(text);
      const detail = j?.detail || j?.error || j?.message || text;
      throw new Error(`${res.status} ${res.statusText}: ${detail}`);
    } catch {
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
  }

  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/** =========================
 * BRD API (via proxy)
 * ========================= */
export const brdApi = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string }>("POST", "/api/brd/sessions", payload),

  createRequirementSet: (payload: { session_id: string; name: string; created_by?: string }) =>
    request<any>("POST", "/api/brd/requirement-sets", {
      session_id: payload.session_id,
      title: payload.name,
      created_by: payload.created_by || "portal",
    }),

  upsertBusinessContext: (
    requirementSetId: string,
    payload: { industry?: string; business_owner?: string; description?: string; stakeholders?: string[] }
  ) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/business-context`,
      payload
    ),

  // IMPORTANT: your backend has BOTH styles in different places.
  // Your logs show: PUT /api/za/api/brd/.../constraints 200
  // So keep this path:
  upsertConstraints: (requirementSetId: string, payload: any) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/constraints`,
      payload
    ),

  upsertGuardrails: (requirementSetId: string, payload: any) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/guardrails`,
      payload
    ),

  submit: (requirementSetId: string, payload: { actor?: string; reason?: string } = {}) =>
    request<any>("POST", `/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/submit`, payload),

  approve: (requirementSetId: string, payload: { actor?: string; reason?: string } = {}) =>
    request<any>("POST", `/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/approve`, payload),
};

/** =========================
 * Deploy API (via proxy)
 * ========================= */
export const deployApi = {
  createPlan: (payload: {
    requirement_set_id: string;
    name_prefix: string;
    region: string;
    environment: string;
    enable_apim: boolean;
    backend_app_hostname: string;
  }) =>
    request<any>("POST", "/api/deploy/plan", payload, {
      // idempotency: stop double-click creating conflicts
      headers: { "X-Idempotency-Key": `plan:${payload.requirement_set_id}` },
    }),

  approveRun: (runId: string) => request<any>("POST", `/api/deploy/${encodeURIComponent(runId)}/approve`),

  refresh: (runId: string) => request<any>("GET", `/api/deploy/${encodeURIComponent(runId)}/refresh`),
};

/** =========================
 * Runs API (via proxy)
 * ========================= */
export type RunEvent = {
  id: number; // maps to event_id
  event_id: number;
  run_id: string;
  level: "info" | "warning" | "error";
  stage: string;
  status: string;
  message: string;
  created_at?: string | null;
  data?: Record<string, any>;
};

export type RunOutputs = {
  run_id: string;
  stage?: string;
  status?: string;

  terraform_vars_json?: any;
  recommendation_snapshot_json?: any;
  connector_snapshot_json?: any;
  constraints_snapshot_json?: any;
  guardrails_snapshot_json?: any;
  brd_snapshot_json?: any;

  requirement_set_id?: string;
  package_id?: string;

  pipeline_id?: string;
  pipeline_run_id?: string;
  pipeline_url?: string;
};

export const client = {
  // ✅ Needed by your run timeline
  getRunOutputs: (runId: string) =>
    request<RunOutputs>("GET", `/runs/${encodeURIComponent(runId)}/outputs`),

  getRunEvents: (runId: string, afterId = 0) =>
    request<RunEvent[]>(
      "GET",
      `/runs/${encodeURIComponent(runId)}/events?after_id=${afterId}`
    ),

  // Backwards compatibility
  getRunStatus: (runId: string) =>
    request<RunOutputs>("GET", `/runs/${encodeURIComponent(runId)}/outputs`),

  // ✅ THIS FIXES your build error in data-checks/page.tsx if it calls client.getProfiling(...)
  getProfiling: (requirementSetId: string) =>
    request<any>(
      "GET",
      `/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/profiling`
    ),
};