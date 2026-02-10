// src/lib/agent.ts
export const AGENT_PROXY_BASE = "/api/agent"; // always same-origin

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  // path must start with "/"
  const p = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${AGENT_PROXY_BASE}${p}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Agent proxy ${res.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const brdApi = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by: string }>(
      "POST",
      "/api/brd/sessions",
      payload
    ),

  createRequirementSet: (payload: { session_id: string; name: string }) =>
    request<any>("POST", "/api/brd/requirement-sets", payload),

  upsertBusinessContext: (requirementSetId: string, payload: any) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${requirementSetId}/business-context`,
      payload
    ),

  upsertConstraints: (requirementSetId: string, payload: any) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${requirementSetId}/constraints`,
      payload
    ),

  upsertGuardrails: (requirementSetId: string, payload: any) =>
    request<any>(
      "PUT",
      `/api/brd/requirement-sets/${requirementSetId}/guardrails`,
      payload
    ),

  submit: (requirementSetId: string) =>
    request<any>("POST", `/api/brd/requirement-sets/${requirementSetId}/submit`),

  approve: (requirementSetId: string) =>
    request<any>(
      "POST",
      `/api/brd/requirement-sets/${requirementSetId}/approve`
    ),
};

export const deployApi = {
  createPlan: (payload: any) => request<any>("POST", "/api/deploy/plan", payload),
  approveRun: (runId: string) =>
    request<any>("POST", `/api/deploy/${runId}/approve`),
  refresh: (runId: string) => request<any>("GET", `/api/deploy/${runId}/refresh`),
};
