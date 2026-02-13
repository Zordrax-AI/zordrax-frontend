// src/lib/brd.ts
/* =========================================================
   BRD Lifecycle Client (Mozart Wizard)

   IMPORTANT:
   - This file is intentionally additive. It does NOT modify the existing
     recommend/deploy flow.
   - Uses the same NEXT_PUBLIC_* base URL strategy as src/lib/api.ts.

   Backend routes (confirmed in onboarding-repo openapi.json):
     POST /api/brd/sessions
     POST /api/brd/requirement-sets
     GET  /api/brd/requirement-sets/{requirement_set_id}
     PUT  /api/brd/requirement-sets/{requirement_set_id}/business-context
     PUT  /api/brd/constraints/{requirement_set_id}
     PUT  /api/brd/guardrails/{requirement_set_id}
     POST /api/brd/requirement-sets/{requirement_set_id}/submit
     POST /api/brd/requirement-sets/{requirement_set_id}/approve

     POST /api/deploy/plan                       (requirement_set_id)
     POST /api/deploy/{run_id}/approve
     POST /api/deploy/{run_id}/apply             (triggers infra pipeline)
     GET  /api/deploy/{run_id}/refresh
========================================================= */

import { API_BASE, ApiError } from "./api";

export type BrdSessionOut = {
  session_id: string;
  created_by?: string | null;
};

export type RequirementSetOut = {
  id: string;
  session_id: string;
  version: number;
  status: string;
  title?: string;
  created_by?: string;
  change_request_ref?: string | null;
  reject_reason?: string | null;
  diff_from_prev?: Record<string, unknown> | null;

  // Optional: some builds may include these when exporting.
  business_context?: Record<string, unknown> | null;
  constraints?: Record<string, unknown> | null;
  guardrails?: Record<string, unknown> | null;
};

export type BusinessContextIn = {
  industry?: string | null;
  business_owner?: string | null;
  description?: string | null;
  stakeholders?: string[] | null;
};

export type ConstraintsIn = {
  region?: string | null;
  environment?: string | null;
  cloud?: string | null;
};

export type GuardrailsIn = {
  pii_present?: boolean | null;
  gdpr_required?: boolean | null;
  private_networking_required?: boolean | null;
  budget_eur_month?: number | null;
};

type FetchJsonOpts = RequestInit & { idempotencyKey?: string };

async function readErrorBody(res: Response): Promise<string> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      return typeof j === "string" ? j : JSON.stringify(j);
    }
    return await res.text();
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function fetchJson<T>(path: string, opts?: FetchJsonOpts): Promise<T> {
  const normalizedPath = path.startsWith("/api/agent") ? path.replace(/^\/api\/agent/, "") : path;
  const url = `${API_BASE}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers as Record<string, string> | undefined),
  };

  if (opts?.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiError({
      status: res.status,
      url,
      body,
      message: body || `Request failed: ${res.status} ${res.statusText}`,
    });
  }

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* -----------------------------
   BRD Lifecycle
------------------------------ */

export async function brdCreateSession(input: {
  created_by?: string;
}): Promise<BrdSessionOut> {
  return fetchJson<BrdSessionOut>("/api/agent/api/brd/sessions", {
    method: "POST",
    body: JSON.stringify({ created_by: input.created_by ?? "unknown" }),
  });
}

export async function brdCreateRequirementSet(input: {
  session_id: string;
  title?: string;
  created_by?: string;
  change_request_ref?: string | null;
}): Promise<RequirementSetOut> {
  return fetchJson<RequirementSetOut>("/api/agent/api/brd/requirement-sets", {
    method: "POST",
    body: JSON.stringify({
      session_id: input.session_id,
      title: input.title ?? "Requirement Set",
      created_by: input.created_by ?? "unknown",
      change_request_ref: input.change_request_ref ?? null,
    }),
  });
}

export async function brdReadRequirementSet(
  requirement_set_id: string
): Promise<RequirementSetOut> {
  return fetchJson<RequirementSetOut>(
    `/api/agent/api/brd/requirement-sets/${requirement_set_id}`,
    { method: "GET" }
  );
}

export async function brdUpsertBusinessContext(
  requirement_set_id: string,
  body: BusinessContextIn
) {
  return fetchJson<Record<string, unknown>>(
    `/api/agent/api/brd/requirement-sets/${requirement_set_id}/business-context`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );
}

export async function brdUpsertConstraints(
  requirement_set_id: string,
  body: ConstraintsIn
) {
  return fetchJson<Record<string, unknown>>(
    `/api/agent/api/brd/constraints/${requirement_set_id}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );
}

export async function brdUpsertGuardrails(
  requirement_set_id: string,
  body: GuardrailsIn
) {
  return fetchJson<Record<string, unknown>>(
    `/api/agent/api/brd/guardrails/${requirement_set_id}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );
}

export async function brdSubmit(requirement_set_id: string, actor = "portal") {
  return fetchJson<Record<string, unknown>>(
    `/api/agent/api/brd/requirement-sets/${requirement_set_id}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ actor }),
    }
  );
}

export async function brdApprove(requirement_set_id: string, actor = "portal") {
  return fetchJson<Record<string, unknown>>(
    `/api/agent/api/brd/requirement-sets/${requirement_set_id}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ actor }),
    }
  );
}

/* -----------------------------
   Deploy Plan from Requirement Set
------------------------------ */

export type DeployPlanFromReqSetRequest = {
  requirement_set_id: string;
  name_prefix: string;
  region: string;
  environment: string;
  enable_apim?: boolean;
  backend_app_hostname?: string;
};

export type DeployPlanFromReqSetResponse = {
  run_id: string;
  status: string;
  plan_summary?: Record<string, unknown>;
  policy_warnings?: unknown[];
};

export async function deployPlanFromRequirementSet(
  req: DeployPlanFromReqSetRequest
): Promise<DeployPlanFromReqSetResponse> {
  return fetchJson<DeployPlanFromReqSetResponse>("/api/agent/api/deploy/plan", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
