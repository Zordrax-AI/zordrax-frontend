// NO "use server" — this is just a shared client helper

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
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backend) {
    return {
      status: "error",
      message: "NEXT_PUBLIC_BACKEND_URL is not configured. API calls will fail.",
    };
  }

  const response = await fetch(`${backend}/onboarding/ai-and-deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
}
