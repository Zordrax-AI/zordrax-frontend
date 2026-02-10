// src/lib/agent-proxy.ts

type Json = Record<string, any>;

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, clear: () => clearTimeout(t) };
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const { ctrl, clear } = withTimeout(15_000);

  let res: Response;
  try {
    res = await fetch(`/api/agent${p}`, {
      ...init,
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (e: any) {
    throw new Error(
      e?.name === "AbortError"
        ? `Proxy timeout after 15s: /api/agent${p}`
        : `Proxy network error: /api/agent${p} :: ${e?.message || String(e)}`
    );
  } finally {
    clear();
  }

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    // Try to show FastAPI-style {"detail": "..."} cleanly
    try {
      const j = JSON.parse(text);
      throw new Error(`${res.status} ${res.statusText} :: ${j?.detail ?? text}`);
    } catch {
      throw new Error(`${res.status} ${res.statusText} :: ${text}`);
    }
  }

  if (!text) return {} as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return JSON.parse(text) as T;

  return text as unknown as T;
}

/**
 * Normalizer:
 * Backend returns requirement sets as { id: "..." }
 * UI expects { requirement_set_id: "..." }
 */
function normalizeRequirementSet(resp: any) {
  if (!resp || typeof resp !== "object") return resp;
  if (!resp.requirement_set_id && resp.id) {
    return { ...resp, requirement_set_id: resp.id };
  }
  return resp;
}

export const brd = {
  // POST /api/brd/sessions
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by?: string }>("/api/brd/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // POST /api/brd/requirement-sets
  createRequirementSet: (payload: { session_id: string; name: string }) =>
    request<any>("/api/brd/requirement-sets", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then(normalizeRequirementSet),

  // PUT /api/brd/requirement-sets/{requirement_set_id}/business-context
  upsertBusinessContext: (requirement_set_id: string, payload: Json) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/business-context`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // ✅ FIX: PUT /api/brd/constraints/{requirement_set_id}
  upsertConstraints: (requirement_set_id: string, payload: Json) =>
    request(`/api/brd/constraints/${requirement_set_id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // ✅ FIX: PUT /api/brd/guardrails/{requirement_set_id}
  upsertGuardrails: (requirement_set_id: string, payload: Json) =>
    request(`/api/brd/guardrails/${requirement_set_id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // POST /api/brd/requirement-sets/{requirement_set_id}/submit
  submit: (requirement_set_id: string) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/submit`, {
      method: "POST",
    }),

  // POST /api/brd/requirement-sets/{requirement_set_id}/approve
  approve: (requirement_set_id: string) =>
    request(`/api/brd/requirement-sets/${requirement_set_id}/approve`, {
      method: "POST",
    }),
};

export const deploy = {
  // POST /api/deploy/plan
  createPlan: (payload: Json) =>
    request<{ run_id: string }>("/api/deploy/plan", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // POST /api/deploy/{run_id}/approve
  approveRun: (run_id: string) =>
    request(`/api/deploy/${run_id}/approve`, { method: "POST" }),

  // GET /api/deploy/{run_id}/refresh
  refresh: (run_id: string) =>
    request(`/api/deploy/${run_id}/refresh`, { method: "GET" }),
};
