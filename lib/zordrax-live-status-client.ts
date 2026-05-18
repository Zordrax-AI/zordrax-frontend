export const API_BASE =
  process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
  "https://zordrax-onboarding-agent.greenground-d9556cdb.uksouth.azurecontainerapps.io";

export async function startLiveTask(payload:any) {
  const response = await fetch(`${API_BASE}/orchestrate/live-task/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export async function getLiveTaskStatus(runId:string) {
  const response = await fetch(
    `${API_BASE}/orchestrate/live-task/status/${runId}`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
