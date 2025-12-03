"use server";

export async function deployArchitecture(payload: any) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backend) {
    return {
      status: "error",
      message: "NEXT_PUBLIC_BACKEND_URL is not configured.",
    };
  }

  const response = await fetch(`${backend}/onboarding/ai-and-deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return await response.json();
}
