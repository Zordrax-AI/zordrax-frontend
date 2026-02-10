// src/lib/agent-proxy.ts

type Json = Record<string, any>;

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/agent${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} :: ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  // fallback (rare)
  return (await res.text()) as unknown as T;
}

export const brd = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string }>("/api/brd/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createRequirementSet: (payload: { session_id: string; name?: string }) =>
    request<{ requirement_set_id: string }>("/api/brd/requirement-sets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  upsertBusinessContext: (requirement_set_id: string, payload: Json) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/business-context`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  upsertConstraints: (requirement_set_id: string, payload: Json) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/constraints`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  upsertGuardrails: (requirement_set_id: string, payload: Json) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/guardrails`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  submit: (requirement_set_id: string) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/submit`, { method: "POST" }),

  approve: (requirement_set_id: string) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/approve`, { method: "POST" }),
};

export const deploy = {
  createPlan: (payload: Json) =>
    request<{ run_id: string }>("/api/deploy/plan", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approveRun: (run_id: string) =>
    request(`/api/deploy/${run_id}/approve`, { method: "POST" }),

  refresh: (run_id: string) =>
    request(`/api/deploy/${run_id}/refresh`, { method: "GET" }),
};
