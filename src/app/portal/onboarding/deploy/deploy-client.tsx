"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { onboard } from "@/lib/agent";

export default function DeployClient() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deploy() {
    if (!sessionId) {
      setError("Missing session id. Start onboarding again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await onboard({
        mode: "ai",
        session_id: sessionId,
      });

      if (!data?.run_id) throw new Error("Backend did not return run_id");

      router.push(`/portal/status?run=${data.run_id}`);
    } catch (e: any) {
      setError(e?.message || "Deploy failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Ready to deploy</h2>

      {error && (
        <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        onClick={deploy}
        disabled={loading}
        className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy"}
      </button>
    </div>
  );
}
