"use server";

import type { ArchitectureRecommendation, DeployResponse } from "@/types/onboarding";

export type DeployError = { error: string };

export async function deployArchitecture(
  payload: ArchitectureRecommendation
): Promise<DeployResponse | DeployError> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: `Deployment failed: ${res.status}` };
  }

  return res.json();
}
