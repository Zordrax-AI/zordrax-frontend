// src/lib/agent-proxy.ts
// Canonical proxy client for the portal -> Next route -> FastAPI agent
// Always call same-origin /api/agent/... so browser never hits ACA domain directly.

type Json = Record<string, any>;

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, clear: () => clearTimeout(t) };
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;

  const { ctrl, clear } = withTimeout(30_000); // 30s: BRD writes can take time depending on DB
  let res: Response;

  try {
    res = await fetch(`/api/agent${p}`, {
      ...init,
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        // Keep JSON default, but allow callers to override/add
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (e: any) {
    clear();
    const msg =
      e?.name === "AbortError"
        ? `Proxy timeout after 30s: /api/agent${p}`
        : `Proxy network error: /api/agent${p} :: ${e?.message || String(e)}`;
    throw new Error(msg);
  } finally {
    clear();
  }

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    // Prefer FastAPI-style {"detail": "..."} if present
    try {
      const j = JSON.parse(text);
      const detail = j?.detail ?? text;
      throw new Error(`${res.status} ${res.statusText} :: ${detail}`);
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
 * Normalizers: your backend returns requirement sets as { id: "..." }
 * but UI should consistently use requirement_set_id.
 */
function normalizeRequirementSet(resp: any) {
  if (!resp || typeof resp !== "object") return resp;
  if (!resp.requirement_set_id && resp.id) {
    return { ...resp, requirement_set_id: resp.id };
  }
  return resp;
}

export const brd = {
  createSession: (payload: { created_by: string; title: string }) =>
    request<{ session_id: string; created_by?: string }>("/api/brd/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // name is required by your backend. Do not make optional.
  createRequirementSet: (payload: { session_id: string; name: string }) =>
    request<any>("/api/brd/requirement-sets", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => {
      const n = normalizeRequirementSet(r);
      if (!n?.requirement_set_id) {
        throw new Error(`Requirement set response missing id: ${JSON.stringify(r)}`);
      }
      return n;
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
