// src/lib/agent-proxy.ts
// Full canonical proxy client (drift-tolerant).

export type Json = any;

async function agentFetch(path: string, init?: RequestInit): Promise<Json> {
  const p = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`/api/agent${p}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data &&
        (data.detail ||
          data.error ||
          data.message ||
          (Array.isArray(data.errors) ? data.errors.join(", ") : null))) ||
      `Agent error ${res.status} for ${p}`;

    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data;
}

/** BRD endpoints (backend path: /api/brd/...) */
export const brd = {
  createSession: (payload: { created_by: string; title?: string }) =>
    agentFetch(`/api/brd/sessions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Accept BOTH name/title to prevent TS drift
  createRequirementSet: (payload: {
    session_id: string;
    name?: string;
    title?: string;
    created_by?: string;
  }) => {
    const name = (payload.name ?? payload.title ?? "").trim();
    if (!name) throw new Error("createRequirementSet requires name (or title)");

    return agentFetch(`/api/brd/requirement-sets`, {
      method: "POST",
      body: JSON.stringify({
        session_id: payload.session_id,
        name,
        created_by: payload.created_by,
      }),
    });
  },

  getRequirementSet: (requirementSetId: string) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}`, {
      method: "GET",
    }),

  upsertBusinessContext: (requirementSetId: string, payload: any) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/business-context`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  upsertConstraints: (requirementSetId: string, payload: any) =>
    agentFetch(`/api/brd/constraints/${encodeURIComponent(requirementSetId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  upsertGuardrails: (requirementSetId: string, payload: any) =>
    agentFetch(`/api/brd/guardrails/${encodeURIComponent(requirementSetId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Aliases expected by UI code
  submit: (requirementSetId: string, payload: any = {}) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approve: (requirementSetId: string, payload: any = {}) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // canonical names (if you still call them elsewhere)
  submitRequirementSet: (requirementSetId: string, payload: any = {}) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approveRequirementSet: (requirementSetId: string, payload: any = {}) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Connection snapshot endpoints (backend path: /connections/...) */
export const connections = {
  test: (payload: any) =>
    agentFetch(`/connections/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Deploy lifecycle endpoints (backend path: /api/deploy/...) */
export type DeployPlanRequest = {
  requirement_set_id: string;
  name_prefix?: string;
  region?: string;
  environment?: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
  [k: string]: any;
};

export const deploy = {
  // canonical
  plan: (payload: DeployPlanRequest) =>
    agentFetch(`/api/deploy/plan`, { method: "POST", body: JSON.stringify(payload) }),

  // UI alias
  createPlan: (payload: DeployPlanRequest) =>
    agentFetch(`/api/deploy/plan`, { method: "POST", body: JSON.stringify(payload) }),

  // UI alias (this is what your pages call)
  approveRun: (runId: string, payload: any = {}) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refresh: (runId: string) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/refresh`, { method: "GET" }),

  package: (runId: string) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/package`, { method: "GET" }),
};
