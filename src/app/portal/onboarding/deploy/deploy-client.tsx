// src/app/portal/onboarding/deploy/deploy-client.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");

  async function deploy() {
    if (!sessionId) {
      alert("Missing onboarding session");
      return;
    }

    const res = await fetch(`${API}/api/onboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "ai",
        session_id: sessionId,
      }),
    });

    if (!res.ok) {
      alert("Failed to start deployment");
      return;
    }

    const { run_id } = await res.json();
    router.push(`/portal/status?run=${run_id}`);
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Ready to deploy</h2>

      <button
        onClick={deploy}
        className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
      >
        Deploy
      </button>
    </div>
  );
}
