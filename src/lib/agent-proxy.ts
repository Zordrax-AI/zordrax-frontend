// src/lib/agent-proxy.ts

type Json = any;

async function agentFetch(path: string, init?: RequestInit) {
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

export const brd = {
  createSession: (payload: { created_by: string; title?: string }) =>
    agentFetch(`/api/brd/sessions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createRequirementSet: (payload: { session_id: string; title: string; created_by?: string }) =>
    agentFetch(`/api/brd/requirement-sets`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  upsertConstraints: (requirementSetId: string, payload: any) =>
    agentFetch(`/api/brd/constraints/${encodeURIComponent(requirementSetId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const connections = {
  // MUST MATCH your backend route (you already saw POST /api/agent/connections/test 200)
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
