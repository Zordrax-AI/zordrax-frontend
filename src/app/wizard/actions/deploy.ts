"use server";

import type { Manifest, DeployResponse } from "@/types/onboarding";

export interface DeploymentPayload {
  project_name: string;
  description: string;
  requirements: {
    environment: string;
    region: string;
  };
  infrastructure: Manifest["infrastructure"];
  etl: Manifest["etl"];
  governance: Manifest["governance"];
  bi: Manifest["bi"];
}

export async function deployArchitecture(
  payload: DeploymentPayload
): Promise<DeployResponse> {
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
