const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!API_BASE) {
  console.warn("NEXT_PUBLIC_BACKEND_URL is not defined. API calls will fail until it is set.");
}

export type PipelineRun = {
  run_id?: number;
  web_url?: string;
};

export type DeploymentResponse = {
  status?: string;
  message?: string;
  pipeline_run?: PipelineRun;
  run_id?: number;
  recommendations?: unknown;
};

export type BuildStatusResponse = {
  status?: string;
  result?: string;
  details_url?: string;
};

function buildUrl(path: string) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured.");
  }
  return `${API_BASE.replace(/\/+$/, "")}${path}`;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    const message = text || res.statusText;
    throw new Error(`HTTP ${res.status}: ${message}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response from API");
  }
}

export async function postDeployment(path: string): Promise<DeploymentResponse> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

export async function fetchBuildStatus(runId: number): Promise<BuildStatusResponse> {
  const res = await fetch(buildUrl(`/devops/status/${runId}`));
  return handleResponse(res);
}

