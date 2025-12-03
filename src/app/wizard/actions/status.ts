"use server";

export async function checkDeploymentStatus(runId: number) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const response = await fetch(`${backend}/onboarding/deploy-status/${runId}`, {
    method: "GET",
    cache: "no-store",
  });
  return response.json();
}
