// NO "use server" — Azure cannot run server actions in standalone mode

export async function checkDeploymentStatus(runId: number) {
  const backend =
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backend) {
    return {
      status: "error",
      message:
        "Backend URL missing. Set NEXT_PUBLIC_ONBOARDING_API_URL in App Service.",
    };
  }

  const response = await fetch(`${backend}/deploy-status/${runId}`, {
    method: "GET",
    cache: "no-store",
  });

  return response.json();
}
