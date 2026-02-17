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

type HttpMethod = "GET" | "POST" | "PUT";

interface ApiOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  url: string;
  body: string;
  constructor(args: { status: number; url: string; body: string; message?: string }) {
    super(args.message ?? `Request failed (${args.status})`);
    this.name = "ApiError";
    this.status = args.status;
    this.url = args.url;
    this.body = args.body;
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_ONBOARDING_API_BASE is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  const { timeoutMs, headers, ...rest } = options;
  const url = `${API_BASE}${path}`;
  if (process.env.NODE_ENV === "development" && url.includes("/api/api/")) {
    throw new Error(`Double /api detected in request URL: ${url}`);
  }

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers || {}),
    },
    signal: controller.signal,
  }).catch((err) => {
    clearTimeout(timeout);
    throw err;
  });

  clearTimeout(timeout);

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const message = json?.message || json?.detail || text || `Request failed with status ${res.status}`;
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }
  return json as T;
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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await fn();
    if (!until || until(result)) {
      return result;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error("Polling timed out");
    }
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
  constraints: (id: string) => `/api/brd/constraints/${id}`,
  guardrails: (id: string) => `/api/brd/guardrails/${id}`,
  metricsSuggestions: (id: string) => `/api/brd/metrics-intent/${id}/suggestions`,

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

  // Runs (not under /api)
  runs: "/runs",
  run: (runId: string) => `/runs/${runId}`,
  runOutputs: (runId: string) => `/runs/${runId}/outputs`,
  runEvents: (runId: string, afterId?: number) => `/runs/${runId}/events${afterId ? `?after_id=${afterId}` : ""}`,
  runCancel: (runId: string) => `/runs/${runId}/cancel`,

  health: "/health",
};

export function createRequirementSet(payload: { name: string; description?: string }): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(ENDPOINTS.requirementSets, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(ENDPOINTS.requirementSet(id), { method: "GET" });
}

export const brdReadRequirementSet = getRequirementSet;

export function createSession(): Promise<{ session_id: string }> {
  return apiFetch<{ session_id: string }>(ENDPOINTS.sessions, { method: "POST" });
}

export function submitRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(`${ENDPOINTS.requirementSet(id)}/submit`, { method: "POST" });
}

export function approveRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(`${ENDPOINTS.requirementSet(id)}/approve`, { method: "POST" });
}

export function brdSetConnector(requirementSetId: string, connectorId: string) {
  return apiFetch<RequirementSet>(ENDPOINTS.requirementSetConnector(requirementSetId), {
    method: "POST",
    body: JSON.stringify({ connector_id: connectorId }),
  });
}

export function getConstraints(requirementSetId: string): Promise<Constraints> {
  return apiFetch<Constraints>(ENDPOINTS.constraints(requirementSetId), { method: "GET" });
}

export function updateConstraints(requirementSetId: string, payload: Constraints): Promise<Constraints> {
  return apiFetch<Constraints>(ENDPOINTS.constraints(requirementSetId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export const brdUpsertConstraints = updateConstraints;

export function upsertBusinessContext(requirementSetId: string, payload: Record<string, unknown>): Promise<any> {
  return apiFetch<any>(ENDPOINTS.businessContext(requirementSetId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function upsertFunctionalRequirements(requirementSetId: string, payload: Record<string, unknown>): Promise<any> {
  return apiFetch<any>(ENDPOINTS.functionalRequirements(requirementSetId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function upsertGuardrails(requirementSetId: string, payload: Record<string, unknown>): Promise<any> {
  return apiFetch<any>(ENDPOINTS.guardrails(requirementSetId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listConnectors(): Promise<Connector[]> {
  return apiFetch<Connector[]>(ENDPOINTS.connectors, { method: "GET" });
}

export function listConnectorTypes(): Promise<string[]> {
  return apiFetch<string[]>(ENDPOINTS.connectorTypes, { method: "GET" });
}

export function getConnector(id: string): Promise<Connector> {
  return apiFetch<Connector>(ENDPOINTS.connector(id), { method: "GET" });
}

export function createConnector(payload: Record<string, unknown>): Promise<Connector> {
  return apiFetch<Connector>(ENDPOINTS.connectors, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function testConnector(id: string): Promise<ConnectionTestResult> {
  return apiFetch<ConnectionTestResult>(ENDPOINTS.connectorTest(id), { method: "POST" });
}

export function discoverConnector(id: string, payload?: Record<string, unknown>): Promise<{ tables?: TableInfo[] }> {
  return apiFetch<{ tables?: TableInfo[] }>(ENDPOINTS.connectorDiscover(id), {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export const discoverTables = discoverConnector;

export function listTables(connectorId: string): Promise<TableInfo[]> {
  return apiFetch<TableInfo[]>(ENDPOINTS.connectorTables(connectorId), { method: "GET" });
}

export function profileTable(connectorId: string, table: string): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.connectorTableProfile(connectorId), {
    method: "POST",
    body: JSON.stringify({ tables: [table] }),
  });
}

export function sampleTable(connectorId: string, table: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.connectorTableSample(connectorId), {
    method: "POST",
    body: JSON.stringify({ table }),
  });
}

export function profileConnector(id: string, payload?: Record<string, unknown>): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.connectorTableProfile(id), {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export function profileTables(connectorId: string, selected: TableInfo[]): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.connectorTableProfile(connectorId), {
    method: "POST",
    body: JSON.stringify({ tables: selected }),
  });
}

export function deployPlan(payload: DeployPlanRequest): Promise<DeployPlanResponse> {
  return apiFetch<DeployPlanResponse>(ENDPOINTS.deployPlan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deployApprove(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.deployApprove(runId), { method: "POST" });
}

export function deployApply(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.deployApply(runId), { method: "POST" });
}

export function refreshRun(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.deployRefresh(runId), { method: "POST" });
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
  return apiFetch<void>(ENDPOINTS.runCancel(runId), { method: "POST" });
}

export function getPackage(runId: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.deployPackage(runId), { method: "GET" });
}

export function health(): Promise<any> {
  return apiFetch<any>(ENDPOINTS.health, { method: "GET" });
}

export function getMetricsSuggestions(requirementSetId: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.metricsSuggestions(requirementSetId), { method: "GET" });
}

export function getTop3Recommendations(requirementSetId: string): Promise<Top3Option[]> {
  return apiFetch<Top3Option[]>(ENDPOINTS.recommendationsTop3(requirementSetId), { method: "GET" });
}

export function selectRecommendation(requirementSetId: string, optionKey: string): Promise<any> {
  return apiFetch<any>(ENDPOINTS.recommendationsSelect, {
    method: "POST",
    body: JSON.stringify({ requirement_set_id: requirementSetId, option: optionKey }),
  });
}

export const getTop3 = getTop3Recommendations;
export const selectOption = selectRecommendation;
