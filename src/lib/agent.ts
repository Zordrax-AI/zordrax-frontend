// src/lib/agent.ts
export const AGENT_PROXY_BASE = "/api/agent"; // ALWAYS same-origin via Next route
export const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL || "";

function safeJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fetchJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error("NEXT_PUBLIC_AGENT_BASE_URL is not set");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const json = safeJson(text);
  if (!res.ok) {
    const message = (json && (json.detail || json.message)) || text || `Request failed ${res.status}`;
    throw new Error(message);
  }
  return (json as T) ?? (text as unknown as T);
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  // Accept either /api/brd/... or /api/agent/api/brd/... without double-prefixing
  const p = path.startsWith("/api/agent")
    ? path.replace(/^\/api\/agent/, "")
    : path.startsWith("/") ? path : `/${path}`;

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
  const json = safeJson(text);

  if (!res.ok) {
    const detail = (json && (json.detail || json.message)) || text;
    throw new Error(`Agent proxy ${res.status} ${res.statusText}: ${detail}`);
  }

  return json ?? (text as unknown as T) ?? ({} as T);
}

export async function agentGet<T>(path: string, params?: Record<string, string | number | undefined>) {
  const qs = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return fetchJSON<T>(`${path}${qs}`, { method: "GET" });
}

export async function agentPost<T>(path: string, body?: any) {
  return fetchJSON<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export async function agentPut<T>(path: string, body?: any) {
  return fetchJSON<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export const brdApi = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by?: string }>("POST", "/api/agent/api/brd/sessions", payload),

  // Backend expects title/created_by; UI often has name -> map to title
  createRequirementSet: (payload: { session_id: string; name: string; created_by?: string }) =>
    request<any>("POST", "/api/agent/api/brd/requirement-sets", {
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
      `/api/agent/api/brd/requirement-sets/${requirementSetId}/business-context`,
      payload
    ),

  // ✅ FIXED PATH: backend is /api/brd/constraints/{id}
  upsertConstraints: (
    requirementSetId: string,
    payload: { cloud?: string; region?: string; environment?: string }
  ) => request<any>("PUT", `/api/agent/api/brd/constraints/${requirementSetId}`, payload),

  // ✅ FIXED PATH: backend is /api/brd/guardrails/{id}
  upsertGuardrails: (
    requirementSetId: string,
    payload: {
      pii_present?: boolean;
      gdpr_required?: boolean;
      private_networking_required?: boolean;
      budget_eur_month?: number;
    }
  ) => request<any>("PUT", `/api/agent/api/brd/guardrails/${requirementSetId}`, payload),

  // These endpoints require a JSON body — send {} unless you use actor/reason
  submit: (requirementSetId: string, payload: { actor?: string; reason?: string } = {}) =>
    request<any>("POST", `/api/agent/api/brd/requirement-sets/${requirementSetId}/submit`, payload),

  approve: (requirementSetId: string, payload: { actor?: string; reason?: string } = {}) =>
    request<any>("POST", `/api/agent/api/brd/requirement-sets/${requirementSetId}/approve`, payload),
};

export const deployApi = {
  createPlan: (payload: {
    requirement_set_id: string;
    name_prefix: string;
    region: string;
    environment: string;
    enable_apim: boolean;
    backend_app_hostname: string;
  }) => request<any>("POST", "/api/agent/api/deploy/plan", payload),

  // ✅ now triggers pipeline in backend
  approveRun: (runId: string) => request<any>("POST", `/api/agent/api/deploy/${runId}/approve`),

  refresh: (runId: string) => request<any>("GET", `/api/agent/api/deploy/${runId}/refresh`),
};

// Lightweight direct client (browser-safe, no secrets)
export const client = {
  createRequirementSet: (payload?: any) => fetchJSON<any>("/api/requirement-sets", { method: "POST", body: JSON.stringify(payload || {}) }),
  getRequirementSet: (id: string) => fetchJSON<any>(`/api/requirement-sets/${id}`, { method: "GET" }),
  postProfiling: (id: string, payload: any) =>
    fetchJSON<any>(`/api/profiling/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  getProfiling: (id: string) => fetchJSON<any>(`/api/profiling/${id}`, { method: "GET" }),
  planDeploy: (payload: any) => fetchJSON<any>("/api/deploy/plan", { method: "POST", body: JSON.stringify(payload) }),
  getRecommendations: (requirementSetId: string) =>
    fetchJSON<any>(`/api/recommendations/top3?requirement_set_id=${encodeURIComponent(requirementSetId)}`, {
      method: "GET",
    }),
  selectRecommendation: (requirementSetId: string, optionId: string) =>
    fetchJSON<any>("/api/recommendations/select", {
      method: "POST",
      body: JSON.stringify({ requirement_set_id: requirementSetId, option_id: optionId }),
    }),
  approveRun: (runId: string) => fetchJSON<any>(`/api/deploy/${runId}/approve`, { method: "POST" }),
  applyRun: (runId: string) => fetchJSON<any>(`/api/deploy/${runId}/apply`, { method: "POST" }),
  refreshRun: (runId: string) => fetchJSON<any>(`/api/deploy/${runId}/refresh`, { method: "GET" }),
  getRunStatus: (runId: string) => fetchJSON<any>(`/api/deploy/${runId}/status`, { method: "GET" }),
  getRunOutputs: (runId: string) => fetchJSON<any>(`/api/deploy/${runId}/outputs`, { method: "GET" }),
  getRunEvents: (runId: string, after_id?: string | number) =>
    fetchJSON<any>(`/runs/${runId}/events${after_id ? `?after_id=${after_id}` : ""}`, { method: "GET" }),
  listRuns: (limit = 50) => fetchJSON<any>(`/runs/?limit=${limit}`, { method: "GET" }),
  getRequirementSetInputs: (id: string) =>
    fetchJSON<any>(`/api/brd/requirement-sets/${id}/inputs`, { method: "GET" }),
  getRequirementSetServer: (id: string) => fetchJSON<any>(`/api/brd/requirement-sets/${id}`, { method: "GET" }),
};
