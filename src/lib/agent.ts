// src/lib/agent.ts

export const AGENT_PROXY_BASE = "/api/agent"; // same-origin proxy (Next route)

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  // Accept either /api/... or runs/... and normalize to "/..."
  const p = path.startsWith("/") ? path : `/${path}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(`${AGENT_PROXY_BASE}${p}`, {
      method,
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `Agent proxy timeout after 15s calling ${AGENT_PROXY_BASE}${p}`
        : `Agent proxy network error calling ${AGENT_PROXY_BASE}${p}: ${e?.message || String(e)}`;
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  if (!res.ok) {
    try {
      const j = JSON.parse(text);
      throw new Error(`Agent proxy ${res.status} ${res.statusText}: ${j?.detail ?? text}`);
    } catch {
      throw new Error(`Agent proxy ${res.status} ${res.statusText}: ${text}`);
    }
  }

  // Some endpoints might return empty body
  if (!text) return {} as T;

  // Normal JSON response
  return JSON.parse(text) as T;
}

/** =========================
 * BRD API (via proxy)
 * ========================= */
export const brdApi = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by?: string }>("POST", "/api/brd/sessions", payload),

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

  upsertConstraints: (requirementSetId: string, payload: { cloud?: string; region?: string; environment?: string }) =>
    request<any>("PUT", `/api/brd/constraints/${encodeURIComponent(requirementSetId)}`, payload),

  upsertGuardrails: (
    requirementSetId: string,
    payload: { pii_present?: boolean; gdpr_required?: boolean; private_networking_required?: boolean; budget_eur_month?: number }
  ) => request<any>("PUT", `/api/brd/guardrails/${encodeURIComponent(requirementSetId)}`, payload),

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
  }) => request<any>("POST", "/api/deploy/plan", payload),

  approveRun: (runId: string) => request<any>("POST", `/api/deploy/${encodeURIComponent(runId)}/approve`),

  refresh: (runId: string) => request<any>("GET", `/api/deploy/${encodeURIComponent(runId)}/refresh`),
};

/** =========================
 * Runs API (via proxy)
 * ========================= */
export type RunEvent = {
  id: number;          // mapped to event_id
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
  // Canonical “status” payload
  getRunOutputs: (runId: string) => request<RunOutputs>("GET", `/runs/${encodeURIComponent(runId)}/outputs`),

  // Timeline events, incremental
  getRunEvents: (runId: string, afterId = 0) =>
    request<RunEvent[]>("GET", `/runs/${encodeURIComponent(runId)}/events?after_id=${afterId}`),

  // Keep name for compatibility with your UI code:
  // return outputs so Run page works without needing a /status endpoint.
  getRunStatus: (runId: string) => request<RunOutputs>("GET", `/runs/${encodeURIComponent(runId)}/outputs`),
};