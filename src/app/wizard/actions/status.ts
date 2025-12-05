// NO "use server" — used from the client

export async function checkDeploymentStatus(runId: number) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backend) {
    return {
      status: "error",
      message: "NEXT_PUBLIC_BACKEND_URL is not configured. API calls will fail.",
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
