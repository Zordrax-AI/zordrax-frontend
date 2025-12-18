"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function GenerateClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API}/api/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ai" }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const { run_id } = await res.json();
      router.push(`/portal/status?run=${run_id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Generate Architecture</h1>

      {error && (
        <div className="text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate"}
      </button>
    </div>
  );
}
