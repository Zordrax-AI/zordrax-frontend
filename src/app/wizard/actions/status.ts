export async function checkDeploymentStatus(runId: number) {
  const backend = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

  if (!backend) {
    return {
      status: "error",
      message: "NEXT_PUBLIC_ONBOARDING_API_URL missing in App Service",
    };
  }

  const response = await fetch(`${backend}/onboarding/deploy-status/${runId}`, {
    method: "GET",
    cache: "no-store",
  });

  return response.json();
}
