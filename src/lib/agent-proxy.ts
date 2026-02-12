// src/lib/agent-proxy.ts

type Json = any;

async function agentFetch(path: string, init?: RequestInit): Promise<Json> {
  const res = await fetch(`/api/agent${path}`, {
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
      (data && (data.detail || data.error || data.message)) ||
      `Agent error ${res.status} for ${path}`;
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

  createRequirementSet: (payload: { session_id: string; name: string; created_by?: string }) =>
    agentFetch(`/api/brd/requirement-sets`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

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

  rejectRequirementSet: (requirementSetId: string, payload: any = {}) =>
    agentFetch(`/api/brd/requirement-sets/${encodeURIComponent(requirementSetId)}/reject`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Connection snapshot endpoints (backend path: /connections/...) */
export const connections = {
  test: (payload: {
    source_type: string;
    host?: string;
    database?: string;
    schema?: string;
    freshness?: string;
    estimated_tables?: number;
    estimated_largest_table_rows?: number;
    compliance_flags?: Record<string, any>;
  }) =>
    agentFetch(`/connections/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Deploy lifecycle endpoints (backend path: /api/deploy/...) */
export const deploy = {
  // Canonical name used by backend
  plan: (payload: { requirement_set_id: string }) =>
    agentFetch(`/api/deploy/plan`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ✅ Alias so UI can call deploy.createPlan(...) without breaking builds
  createPlan: (payload: { requirement_set_id: string }) =>
    agentFetch(`/api/deploy/plan`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approve: (runId: string, payload: any = {}) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  apply: (runId: string, payload: any = {}) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/apply`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refresh: (runId: string) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/refresh`, {
      method: "GET",
    }),

  package: (runId: string) =>
    agentFetch(`/api/deploy/${encodeURIComponent(runId)}/package`, {
      method: "GET",
    }),
};
