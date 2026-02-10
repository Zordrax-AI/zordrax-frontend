// src/lib/agent.ts
export const AGENT_PROXY_BASE = "/api/agent"; // ALWAYS same-origin via Next route

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  // path must start with "/"
  const p = path.startsWith("/") ? path : `/${path}`;

  // Fail fast instead of "hanging"
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(`${AGENT_PROXY_BASE}${p}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `Agent proxy timeout after 10s calling ${AGENT_PROXY_BASE}${p}`
        : `Agent proxy network error calling ${AGENT_PROXY_BASE}${p}: ${e?.message || String(e)}`;
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  if (!res.ok) {
    // Try to surface upstream JSON errors nicely (FastAPI often returns {"detail":...})
    try {
      const j = JSON.parse(text);
      throw new Error(`Agent proxy ${res.status} ${res.statusText}: ${j?.detail ?? text}`);
    } catch {
      throw new Error(`Agent proxy ${res.status} ${res.statusText}: ${text}`);
    }
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const brdApi = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by: string }>("POST", "/api/brd/sessions", payload),

  createRequirementSet: (payload: { session_id: string; name: string }) =>
    request<any>("POST", "/api/brd/requirement-sets", payload),

  upsertBusinessContext: (
    requirementSetId: string,
    payload: { business_goal: string; stakeholders: string; success_metrics: string }
  ) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${requirementSetId}/business-context`,
      payload
    ),

  upsertConstraints: (
    requirementSetId: string,
    payload: { cloud: string; region: string; environment: string }
  ) =>
    request<any>("PUT", `/api/brd/requirement-sets/${requirementSetId}/constraints`, payload),

  upsertGuardrails: (
    requirementSetId: string,
    payload: {
      pii_present: boolean;
      gdpr_required: boolean;
      private_networking_required: boolean;
      budget_eur_month: number;
    }
  ) =>
    request<any>("PUT", `/api/brd/requirement-sets/${requirementSetId}/guardrails`, payload),

  submit: (requirementSetId: string) =>
    request<any>("POST", `/api/brd/requirement-sets/${requirementSetId}/submit`),

  approve: (requirementSetId: string) =>
    request<any>("POST", `/api/brd/requirement-sets/${requirementSetId}/approve`),
};

export const deployApi = {
  createPlan: (payload: {
    requirement_set_id: string;
    name_prefix: string;
    region: string;
    environment: string;
    enable_apim: boolean;
    backend_app_hostname: string;
  }) => request<any>("POST", "/api/deploy/plan", payload),

  approveRun: (runId: string) => request<any>("POST", `/api/deploy/${runId}/approve`),

  refresh: (runId: string) => request<any>("GET", `/api/deploy/${runId}/refresh`),
};
