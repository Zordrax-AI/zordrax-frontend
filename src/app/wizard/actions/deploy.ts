"use server";

export interface DeploymentPayload {
  project_name: string;
  description: string;
  requirements: {
    environment: string;
    region: string;
  };
  infrastructure: Record<string, any>;
  etl: Record<string, any>;
  governance: Record<string, any>;
  bi: Record<string, any>;
}

export async function deployArchitecture(payload: DeploymentPayload) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Deployment failed: ${res.status}`);
  }

  return res.json();
}
