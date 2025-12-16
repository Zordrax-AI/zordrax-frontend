"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onboard } from "@/lib/agent";

export default function GenerateClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const res = await onboard({
        mode: "ai",
      });

      if (!res?.run_id) {
        throw new Error("Backend did not return run_id");
      }

      router.push(`/portal/status?run=${encodeURIComponent(res.run_id)}`);
    } catch (e: any) {
      setError(e?.message || "Failed to start onboarding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">AI Onboarding</h1>
        <p className="text-sm text-slate-400">
          Start an AI-guided Zordrax onboarding run.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading ? "Starting…" : "Start AI Onboarding"}
      </button>
    </div>
  );
}
