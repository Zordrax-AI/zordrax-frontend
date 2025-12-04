// NOTE: No "use server" — standalone mode cannot run server actions

export async function checkDeploymentStatus(runId: number) {
  const backend = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

  if (!backend) {
    return {
      status: "error",
      message:
        "Backend URL missing. Set NEXT_PUBLIC_ONBOARDING_API_URL in App Service.",
    };
  }

  const response = await fetch(
    `${backend}/onboarding/deploy-status/${runId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return response.json();
}
