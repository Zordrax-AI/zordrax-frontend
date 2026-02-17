import { RequirementSet, Connector, ConnectionTestResult, TableInfo, ProfilingSummary, DeployPlanResponse, RunStatus } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_BASE || "";

type HttpMethod = "GET" | "POST" | "PUT";

interface ApiOptions extends RequestInit {
  timeoutMs?: number;
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
  connectors: "/api/connectors",
  connector: (id: string) => `/api/connectors/${id}`,
  connectorTest: (id: string) => `/api/connectors/${id}/test`,
  connectorDiscover: (id: string) => `/api/connectors/${id}/discover`,
  profiling: (id: string) => `/api/connectors/${id}/profiling`,
  deployPlan: "/api/deploy/plan",
  refreshRun: (runId: string) => `/api/deploy/${runId}/refresh`,
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

export function submitRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(`${ENDPOINTS.requirementSet(id)}/submit`, { method: "POST" });
}

export function approveRequirementSet(id: string): Promise<RequirementSet> {
  return apiFetch<RequirementSet>(`${ENDPOINTS.requirementSet(id)}/approve`, { method: "POST" });
}

export function listConnectors(): Promise<Connector[]> {
  return apiFetch<Connector[]>(ENDPOINTS.connectors, { method: "GET" });
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

export function discoverTables(connectorId: string): Promise<{ tables: TableInfo[] }> {
  return apiFetch<{ tables: TableInfo[] }>(ENDPOINTS.connectorDiscover(connectorId), { method: "POST" });
}

export function profileTables(connectorId: string, selected: TableInfo[]): Promise<ProfilingSummary> {
  return apiFetch<ProfilingSummary>(ENDPOINTS.profiling(connectorId), {
    method: "POST",
    body: JSON.stringify({ tables: selected }),
  });
}

export function deployPlan(payload: { requirement_set_id: string; connector_id?: string }): Promise<DeployPlanResponse> {
  return apiFetch<DeployPlanResponse>(ENDPOINTS.deployPlan, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function refreshRun(runId: string): Promise<RunStatus> {
  return apiFetch<RunStatus>(ENDPOINTS.refreshRun(runId), { method: "POST" });
}
