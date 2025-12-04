// No "use server" — runs client side

export async function deployArchitecture(payload: unknown): Promise<unknown> {
  const backend = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

  if (!backend) {
    return {
      status: "error",
      message: "NEXT_PUBLIC_ONBOARDING_API_URL missing in App Service",
    };
  }

  const response = await fetch(`${backend}/ai-and-deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
}
