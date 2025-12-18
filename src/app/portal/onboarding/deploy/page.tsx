"use client";

import { useSearchParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

export default function DeployPage() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");

  async function deploy() {
    const res = await fetch(`${API}/api/onboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, mode: "ai" }),
    });

    const { run_id } = await res.json();
    router.push(`/portal/status?run=${run_id}`);
  }

  return (
    <div className="p-6">
      <button
        onClick={deploy}
        className="rounded bg-emerald-600 px-4 py-2 text-white"
      >
        Deploy
      </button>
    </div>
  );
}
