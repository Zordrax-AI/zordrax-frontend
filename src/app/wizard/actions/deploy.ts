import type { Manifest, DeployResponse } from "@/types/onboarding";

export interface DeploymentPayload {
  project_name: string;
  description: string;
  requirements: {
    environment: string;
    region: string;
  };
  infrastructure: Manifest["infrastructure"];
  etl: Manifest["etl"];
  governance: Manifest["governance"];
  bi: Manifest["bi"];
}

export interface DeployError {
  error: string;
  status?: number;
  backend?: unknown;
}

/**
 * Client-side helper to call the onboarding backend /deploy endpoint.
 * - Does NOT throw on HTTP error
 * - Returns a DeployResponse on success
 * - Returns a DeployError on failure
 */
export async function deployArchitecture(
  payload: DeploymentPayload
): Promise<DeployResponse | DeployError> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/deploy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    // Read raw text first (backend may return non-JSON errors)
    const rawText = await res.text();
    let data: unknown = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = rawText; // In case backend returns plain text
    }

    if (!res.ok) {
      return {
        error: `Deployment failed: ${res.status}`,
        status: res.status,
        backend: data,
      };
    }

    return data as DeployResponse;
  } catch (err: unknown) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Deployment request failed unexpectedly",
    };
  }
}
