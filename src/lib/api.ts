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

export const API_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_BASE || "/api/za";

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
  const res = await fetch(`${API_BASE}${path}`, {
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
  requirementSets: "/api/brd/requirement-sets",
  requirementSet: (id: string) => `/api/brd/requirement-sets/${id}`,
  requirementSetConnector: (id: string) => `/api/brd/requirement-sets/${id}/connector`,
  constraints: (id: string) => `/api/brd/constraints/${id}`,
  metricsSuggestions: (id: string) => `/api/brd/metrics-intent/${id}/suggestions`,
  recommendationsTop3: (id: string) => `/api/brd/recommendations/top3?requirement_set_id=${encodeURIComponent(id)}`,
  recommendationsSelect: "/api/brd/recommendations/select",
  connectors: "/api/connectors",
  connector: (id: string) => `/api/connectors/${id}`,
  connectorTest: (id: string) => `/api/connectors/${id}/test`,
  connectorDiscover: (id: string) => `/api/connectors/${id}/discover`,
  connectorProfile: (id: string) => `/api/connectors/${id}/profile`,
  profiling: (id: string) => `/api/connectors/${id}/profiling`,
  deployPlan: "/api/deploy/plan",
  refreshRun: (runId: string) => `/api/deploy/${runId}/refresh`,
  runs: "/api/deploy/runs",
  run: (runId: string) => `/api/deploy/${runId}`,
  runOutputs: (runId: string) => `/api/deploy/${runId}/outputs`,
  runEvents: (runId: string, afterId?: number) =>
    `/api/deploy/${runId}/events${afterId ? `?after_id=${afterId}` : ""}`,
  runCancel: (runId: string) => `/api/deploy/${runId}/cancel`,
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

export function listConnectors(): Promise<Connector[]> {
  return apiFetch<Connector[]>(ENDPOINTS.connectors, { method: "GET" });
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

export function profileConnector(id: string): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.connectorProfile(id), { method: "POST" });
}

export function profileTables(connectorId: string, selected: TableInfo[]): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.profiling(connectorId), {
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
  return apiFetch<RunStatus>(`${ENDPOINTS.run(runId)}/approve`, { method: "POST" });
}

export function deployApply(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(`${ENDPOINTS.run(runId)}/apply`, { method: "POST" });
}

export function refreshRun(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.refreshRun(runId), { method: "POST" });
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
