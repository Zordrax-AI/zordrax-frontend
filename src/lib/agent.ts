// src/lib/agent.ts
export const AGENT_PROXY_BASE = "/api/agent"; // ALWAYS same-origin via Next route

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

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

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const brdApi = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by?: string }>("POST", "/api/brd/sessions", payload),

  // Backend expects title/created_by; UI often has name -> map to title
  createRequirementSet: (payload: { session_id: string; name: string; created_by?: string }) =>
    request<any>("POST", "/api/brd/requirement-sets", {
      session_id: payload.session_id,
      title: payload.name,
      created_by: payload.created_by || "portal",
    }),

  // ✅ matches backend
  upsertBusinessContext: (
    requirementSetId: string,
    payload: {
      industry?: string;
      business_owner?: string;
      description?: string;
      stakeholders?: string[];
    }
  ) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${requirementSetId}/business-context`,
      payload
    ),

  // ✅ FIXED PATH: backend is /api/brd/constraints/{id}
  upsertConstraints: (
    requirementSetId: string,
    payload: { cloud?: string; region?: string; environment?: string }
  ) => request<any>("PUT", `/api/brd/constraints/${requirementSetId}`, payload),

  // ✅ FIXED PATH: backend is /api/brd/guardrails/{id}
  upsertGuardrails: (
    requirementSetId: string,
    payload: {
      pii_present?: boolean;
      gdpr_required?: boolean;
      private_networking_required?: boolean;
      budget_eur_month?: number;
    }
  ) => request<any>("PUT", `/api/brd/guardrails/${requirementSetId}`, payload),

  // These endpoints require a JSON body — send {} unless you use actor/reason
  submit: (requirementSetId: string, payload: { actor?: string; reason?: string } = {}) =>
    request<any>("POST", `/api/brd/requirement-sets/${requirementSetId}/submit`, payload),

  approve: (requirementSetId: string, payload: { actor?: string; reason?: string } = {}) =>
    request<any>("POST", `/api/brd/requirement-sets/${requirementSetId}/approve`, payload),
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

  // ✅ now triggers pipeline in backend
  approveRun: (runId: string) => request<any>("POST", `/api/deploy/${runId}/approve`),

  refresh: (runId: string) => request<any>("GET", `/api/deploy/${runId}/refresh`),
};
