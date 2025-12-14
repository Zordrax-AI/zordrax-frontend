export type OnboardRequest = {
  mode: "ai" | "manual";
  answers?: Record<string, any>;
  config?: Record<string, any>;
};

export type OnboardResponse = {
  run_id: string;
  status: "queued" | "running" | "completed" | "failed";
  events_url?: string; // SSE endpoint
  status_url?: string; // optional
};

const base =
  process.env.NEXT_PUBLIC_AGENT_BASE_URL?.replace(/\/$/, "") || "";

export function assertAgentBase() {
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_AGENT_BASE_URL is missing. Set it in .env.local"
    );
  }
}

export async function startOnboarding(payload: OnboardRequest): Promise<OnboardResponse> {
  assertAgentBase();

  const res = await fetch(`${base}/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Onboard failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

export function getEventsUrl(runId: string) {
  assertAgentBase();
  return `${base}/runs/${encodeURIComponent(runId)}/events`;
}

export async function getRunStatus(runId: string): Promise<any> {
  assertAgentBase();
  const res = await fetch(`${base}/runs/${encodeURIComponent(runId)}`);
  if (!res.ok) throw new Error(`Status failed (${res.status})`);
  return res.json();
}
