// src/lib/api.ts

import {
  RequirementSet,
  Connector,
  ConnectionTestResult,
  TableInfo,
  ProfilingSummary,
  DeployPlanResponse,
  RunStatus,
  RunRow,
  Constraints,
  Top3Option,
  DeployPlanRequest,
  RecommendRequest,
  InfraOutputsResponse,
  RunEvent,
} from "./types";

export type {
  Connector,
  RunRow,
  RequirementSet,
  TableInfo,
  ProfilingSummary,
  Top3Option,
  DeployPlanRequest,
  DeployPlanResponse,
  RecommendRequest,
  InfraOutputsResponse,
  RunEvent,
};

// Base URL must have no trailing slash. Defaults to same-origin proxy /api/za.
const rawBase = process.env.NEXT_PUBLIC_API_BASE || "/api/za";
export const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

// Lightweight browser-side client pointing at agent base (public URL).
export const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL || "";

/**
 * Browser-side helper (direct call to agent public URL).
 */
export async function fetchJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
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
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const message = (json && (json.detail || json.message)) || text || `Request failed ${res.status}`;
    throw new Error(message);
  }
  return (json as T) ?? (text as unknown as T);
}

/**
 * IMPORTANT:
 * RequestInit.body is typed as BodyInit, which rejects plain objects.
 * We intentionally allow `unknown` and JSON.stringify it at runtime.
 */
export type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(args: { status: number; url: string; body: unknown; message?: string }) {
    super(args.message ?? `Request failed (${args.status})`);
    this.name = "ApiError";
    this.status = args.status;
    this.url = args.url;
    this.body = args.body;
  }
}

/**
 * Server-side / same-origin proxy call via /api/za (route.ts attaches x-api-key).
 * Accepts body as object OR string. Objects get JSON.stringified safely.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  const { timeoutMs, headers, body, ...rest } = options;
  const url = `${API_BASE}${path}`;

  // dev-safety: catch accidental /api/api duplication
  if (process.env.NODE_ENV === "development" && url.includes("/api/api/")) {
    clearTimeout(timeout);
    throw new Error(`Double /api detected in request URL: ${url}`);
  }

  // Normalize body: allow objects and stringify them.
  let normalizedBody: BodyInit | null | undefined = undefined;

  if (body !== undefined && body !== null) {
    const b: any = body;

    const isBodyInit =
      typeof b === "string" ||
      (typeof Blob !== "undefined" && b instanceof Blob) ||
      (typeof ArrayBuffer !== "undefined" && b instanceof ArrayBuffer) ||
      (typeof FormData !== "undefined" && b instanceof FormData) ||
      (typeof URLSearchParams !== "undefined" && b instanceof URLSearchParams);

    normalizedBody = isBodyInit ? (b as BodyInit) : (JSON.stringify(b) as BodyInit);
  }

  try {
    const res = await fetch(url, {
      ...rest,
      body: normalizedBody,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(headers || {}),
      },
      signal: controller.signal,
    });

    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    if (!res.ok) {
      const message = json?.message || json?.detail || text || `Request failed with status ${res.status}`;
      throw new ApiError({ status: res.status, url, body: json ?? text, message });
    }

    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function poll<T>(
  fn: () => Promise<T>,
  {
    intervalMs = 3000,
    timeoutMs = 10 * 60 * 1000,
    until,
  }: { intervalMs?: number; timeoutMs?: number; until?: (result: T) => boolean } = {}
): Promise<T> {
  const start = Date.now();
  while (true) {
    const result = await fn();
    if (!until || until(result)) return result;
    if (Date.now() - start > timeoutMs) throw new Error("Polling timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

const ENDPOINTS = {
  // BRD
  sessions: "/api/brd/sessions",
  requirementSets: "/api/brd/requirement-sets",
  requirementSet: (id: string) => `/api/brd/requirement-sets/${id}`,
  requirementSetConnector: (id: string) => `/api/brd/requirement-sets/${id}/connector`,
  businessContext: (id: string) => `/api/brd/business-context/${id}`,
  functionalRequirements: (id: string) => `/api/brd/functional-requirements/${id}`,
  constraints: (id: string) => `/api/brd/requirement-sets/${id}/constraints`,
  requirementInputs: (id: string) => `/api/brd/requirement-sets/${id}/inputs`,
  guardrails: (id: string) => `/api/brd/guardrails/${id}`,

  // Connectors
  connectorTypes: "/api/connectors/types",
  connectors: "/api/connectors",
  connector: (id: string) => `/api/connectors/${id}`,
  connectorTest: (id: string) => `/api/connectors/${id}/test`,
  connectorDiscover: (id: string) => `/api/connectors/${id}/discover`,
  connectorTables: (id: string) => `/api/connectors/${id}/tables`,
  connectorTableProfile: (id: string) => `/api/connectors/${id}/tables/profile`,
  connectorTableSample: (id: string) => `/api/connectors/${id}/tables/sample`,

  // Recommendations
  recommendationsTop3: (id: string) => `/api/recommendations/top3?requirement_set_id=${encodeURIComponent(id)}`,
  recommendationsSelect: "/api/recommendations/select",

  // Deploy
  deployPlan: "/api/deploy/plan",
  deployApprove: (runId: string) => `/api/deploy/${runId}/approve`,
  deployApply: (runId: string) => `/api/deploy/${runId}/apply`,
  deployRefresh: (runId: string) => `/api/deploy/${runId}/refresh`,
  deployPackage: (runId: string) => `/api/deploy/${runId}/package`,

  // Runs (NOT under /api)
  runs: "/runs",
  runOutputs: (runId: string) => `/runs/${runId}/outputs`,
  runEvents: (runId: string, afterId?: number) => `/runs/${runId}/events${afterId ? `?after_id=${afterId}` : ""}`,
  runCancel: (runId: string) => `/runs/${runId}/cancel`,

  health: "/health",
};

// -----------------------
// BRD
// -----------------------

export function createRequirementSet(payload: { name: string; description?: string }): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(ENDPOINTS.requirementSets, { method: "POST", body: payload });
}

export function getRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(ENDPOINTS.requirementSet(id), { method: "GET" });
}

export function createSession(): Promise<{ session_id: string }> {
  return apiFetch<{ session_id: string }>(ENDPOINTS.sessions, { method: "POST", body: {} });
}

export function submitRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(`${ENDPOINTS.requirementSet(id)}/submit`, { method: "POST", body: {} });
}

export function approveRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(`${ENDPOINTS.requirementSet(id)}/approve`, { method: "POST", body: {} });
}

// Logs showed 405 for POST here => use PUT.
export function brdSetConnector(requirementSetId: string, connectorId: string) {
  return apiFetch<RequirementSet>(ENDPOINTS.requirementSetConnector(requirementSetId), {
    method: "PUT",
    body: { connector_id: connectorId },
  });
}

// /inputs sometimes 404s => derive from requirement set.
export function getConstraints(requirementSetId: string): Promise<Constraints> {
  return getRequirementSet(requirementSetId).then((rs: any) => rs?.constraints_json || rs?.constraints || {});
}

export function updateConstraints(requirementSetId: string, payload: Constraints): Promise<Constraints> {
  return apiFetch<Constraints>(ENDPOINTS.constraints(requirementSetId), { method: "PUT", body: payload });
}

export function upsertBusinessContext(requirementSetId: string, payload: Record<string, unknown>): Promise<any> {
  return apiFetch<any>(ENDPOINTS.businessContext(requirementSetId), { method: "PUT", body: payload });
}

export function upsertFunctionalRequirements(requirementSetId: string, payload: Record<string, unknown>): Promise<any> {
  return apiFetch<any>(ENDPOINTS.functionalRequirements(requirementSetId), { method: "PUT", body: payload });
}

export function upsertGuardrails(requirementSetId: string, payload: Record<string, unknown>): Promise<any> {
  return apiFetch<any>(ENDPOINTS.guardrails(requirementSetId), { method: "PUT", body: payload });
}

// Compatibility exports (your mozart flow imports these)
export const brdReadRequirementSet = getRequirementSet;
export const brdUpsertConstraints = updateConstraints;

// -----------------------
// CONNECTORS
// -----------------------

export function listConnectors(): Promise<Connector[]> {
  return apiFetch<Connector[]>(ENDPOINTS.connectors, { method: "GET" });
}

export function listConnectorTypes(): Promise<string[]> {
  return apiFetch<string[]>(ENDPOINTS.connectorTypes, { method: "GET" });
}

export function getConnector(id: string): Promise<Connector> {
  return apiFetch<Connector>(ENDPOINTS.connector(id), { method: "GET" });
}

// Reduce 422s by sending both common aliases.
export function createConnector(payload: Record<string, unknown>): Promise<Connector> {
  const p: any = payload || {};
  const name = p.name;
  const type = p.type ?? p.connector_type ?? p.connectorType;
  const config = p.config ?? p.config_json ?? p.configJson ?? {};

  return apiFetch<Connector>(ENDPOINTS.connectors, {
    method: "POST",
    body: {
      name,
      type,
      connector_type: type,
      connectorType: type,
      config,
      config_json: config,
      configJson: config,
    },
  });
}

export function testConnector(id: string): Promise<ConnectionTestResult> {
  return apiFetch<ConnectionTestResult>(ENDPOINTS.connectorTest(id), { method: "POST", body: {} });
}

export function discoverConnector(id: string, payload?: Record<string, unknown>): Promise<{ tables?: TableInfo[] }> {
  return apiFetch<{ tables?: TableInfo[] }>(ENDPOINTS.connectorDiscover(id), {
    method: "POST",
    body: payload ?? {},
  });
}

// ✅ Compatibility alias used by older onboarding pages
export const discoverTables = discoverConnector;

export function listTables(connectorId: string): Promise<TableInfo[]> {
  return apiFetch<TableInfo[]>(ENDPOINTS.connectorTables(connectorId), { method: "GET" });
}

// ✅ Needed by mozart/data-checks
export function profileConnector(connectorId: string, payload?: Record<string, unknown>): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.connectorTableProfile(connectorId), {
    method: "POST",
    body: payload ?? {},
  });
}

export function profileTables(connectorId: string, selected: TableInfo[]): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.connectorTableProfile(connectorId), {
    method: "POST",
    body: { tables: selected },
  });
}

export function sampleTable(connectorId: string, table: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.connectorTableSample(connectorId), {
    method: "POST",
    body: { table },
  });
}

// -----------------------
// RECOMMENDATIONS
// -----------------------

export function getTop3Recommendations(requirementSetId: string): Promise<Top3Option[]> {
  return apiFetch<Top3Option[]>(ENDPOINTS.recommendationsTop3(requirementSetId), { method: "GET" });
}

export function selectRecommendation(requirementSetId: string, optionKey: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.recommendationsSelect, {
    method: "POST",
    body: {
      requirement_set_id: requirementSetId,
      option: optionKey,
      option_key: optionKey,
      recommendation_id: optionKey,
    },
  });
}

export const getTop3 = getTop3Recommendations;
export const selectOption = selectRecommendation;

// -----------------------
// DEPLOY / RUNS
// -----------------------

export function deployPlan(payload: DeployPlanRequest): Promise<DeployPlanResponse> {
  return apiFetch<DeployPlanResponse>(ENDPOINTS.deployPlan, { method: "POST", body: payload });
}

export function deployApprove(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.deployApprove(runId), { method: "POST", body: {} });
}

export function deployApply(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.deployApply(runId), { method: "POST", body: {} });
}

export function refreshRun(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.deployRefresh(runId), { method: "GET" });
}

export const deployRefresh = refreshRun;

export function listRuns(): Promise<RunRow[]> {
  return apiFetch<RunRow[]>(ENDPOINTS.runs, { method: "GET" });
}

export function getInfraOutputs(runId: string): Promise<InfraOutputsResponse> {
  return apiFetch<InfraOutputsResponse>(ENDPOINTS.runOutputs(runId), { method: "GET" });
}

export function getRunEvents(runId: string, afterId?: number): Promise<RunEvent[]> {
  return apiFetch<RunEvent[]>(ENDPOINTS.runEvents(runId, afterId), { method: "GET" });
}

export function cancelRun(runId: string): Promise<void> {
  return apiFetch<void>(ENDPOINTS.runCancel(runId), { method: "POST", body: {} });
}

export function getPackage(runId: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.deployPackage(runId), { method: "GET" });
}

export function health(): Promise<any> {
  return apiFetch<any>(ENDPOINTS.health, { method: "GET" });
}

// -----------------------
// Legacy browser-facing helpers (still used by a couple pages)
// -----------------------

export function planDeploy(payload: { requirement_set_id: string }): Promise<any> {
  return fetchJSON("/api/deploy/plan", { method: "POST", body: JSON.stringify(payload) });
}

export function approveRun(runId: string): Promise<any> {
  return fetchJSON(`/api/deploy/${runId}/approve`, { method: "POST", body: "{}" });
}

export function getRunStatus(runId: string): Promise<any> {
  return fetchJSON(`/api/deploy/${runId}/refresh`, { method: "GET" });
}

// Stable no-op to keep UI from breaking if metrics endpoint isn't implemented yet
export function getMetricsSuggestions(_: string): Promise<any> {
  return Promise.resolve([]);
}
