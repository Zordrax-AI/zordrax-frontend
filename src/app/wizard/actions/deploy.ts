// NO "use server" HERE — THIS IS NOW A CLIENT UTILITY FUNCTION

export type DeploymentRequirements = {
  environment: string;
  region: string;
};

export type DeploymentPayload = {
  project_name: string;
  description: string;
  requirements: DeploymentRequirements;
};

export async function deployArchitecture(
  payload: DeploymentPayload
): Promise<unknown> {
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

  const response = await fetch(`${backend}/ai-and-deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await response.json();
}
