// src/app/wizard/status/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PipelineStatus {
  id?: number;
  status?: string;
  result?: string;
  url?: string;
  [key: string]: unknown;
}

export default function StatusPage() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function fetchStatus() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/onboarding/deploy-status/${runId}`
        );

        if (!res.ok) {
          throw new Error(`Backend returned ${res.status}`);
        }

        const data = (await res.json()) as PipelineStatus;
        setStatus(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load status"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [runId]);

  if (!runId) {
    return <div className="p-6">Missing run id.</div>;
  }

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold">Deployment Status</h1>
      <p className="text-sm text-gray-600">Run ID: {runId}</p>

      {loading && <p>Loading status…</p>}
      {error && <p className="text-sm text-red-500">Error: {error}</p>}

      {status && (
        <pre className="bg-gray-900 text-white text-sm p-4 rounded overflow-auto">
          {JSON.stringify(status, null, 2)}
        </pre>
      )}
    </div>
  );
}
