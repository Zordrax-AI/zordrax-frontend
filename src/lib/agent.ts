// src/lib/agent.ts

const PROXY_PREFIX = "/api/agent";

/**
 * Build a safe proxy URL.
 * Accepts:
 *   "/api/brd/sessions"
 *   "api/brd/sessions"
 *   "/api/agent/api/brd/sessions"  (accidental) -> normalized
 *
 * Returns:
 *   "/api/agent/api/brd/sessions"
 */
export function agentUrl(path: string): string {
  let p = (path || "").trim();

  // If someone pastes a full URL, strip the origin.
  p = p.replace(/^https?:\/\/[^/]+/i, "");

  // Prevent double prefix: /api/agent/api/agent/...
  if (p.startsWith(PROXY_PREFIX)) p = p.slice(PROXY_PREFIX.length);

  // Ensure leading slash
  if (!p.startsWith("/")) p = `/${p}`;

  return `${PROXY_PREFIX}${p}`;
}

async function parseResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function agentFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = agentUrl(path);

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      // Only set Content-Type automatically when we have a body (avoid weirdness on GET)
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`agentFetch failed: ${res.status} ${res.statusText} :: ${url}\n${body.slice(0, 400)}`);
  }

  return parseResponse(res) as Promise<T>;
}

// ------------------------------------------------------------
// Typed-ish API wrappers used by Mozart
// ------------------------------------------------------------

export const brd = {
  createSession: (body: { created_by: string; title: string }) =>
    agentFetch<{ session_id: string }>("/api/brd/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createRequirementSet: (body: { session_id: string; name?: string }) =>
    agentFetch<{ requirement_set_id: string }>("/api/brd/requirement-sets", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  upsertBusinessContext: (requirement_set_id: string, body: any) =>
    agentFetch(`/api/brd/requirement-sets/${requirement_set_id}/business-context`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  upsertConstraints: (requirement_set_id: string, body: any) =>
    agentFetch(`/api/brd/requirement-sets/${requirement_set_id}/constraints`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  upsertGuardrails: (requirement_set_id: string, body: any) =>
    agentFetch(`/api/brd/requirement-sets/${requirement_set_id}/guardrails`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  submit: (requirement_set_id: string) =>
    agentFetch(`/api/brd/requirement-sets/${requirement_set_id}/submit`, {
      method: "POST",
    }),

  approve: (requirement_set_id: string) =>
    agentFetch(`/api/brd/requirement-sets/${requirement_set_id}/approve`, {
      method: "POST",
    }),
};

export const deploy = {
  createPlan: (body: any) =>
    agentFetch<{ run_id: string; status?: string; plan_summary?: any; policy_warnings?: any[] }>(
      "/api/deploy/plan",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  approveRun: (run_id: string) =>
    agentFetch(`/api/deploy/${run_id}/approve`, {
      method: "POST",
    }),

  refresh: (run_id: string) =>
    agentFetch(`/api/deploy/${run_id}/refresh`, {
      method: "GET",
    }),
};
