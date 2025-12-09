"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface PipelineStatus {
  run_id?: number;
  status?: string;
  stage?: string;
  message?: string;
  url?: string;
}

function StatusContent() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [details, setDetails] = useState<PipelineStatus | null>(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!runId) return;

    async function fetchStatus() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/onboarding/deploy-status/${runId}`
        );

        const data = await res.json();
        setDetails(data);
        setStatus(data?.status ?? "unknown");
      } catch {
        setStatus("error");
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) return <p>No pipeline run ID found.</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Pipeline Status</h1>

      <pre className="bg-gray-900 text-white p-3 rounded text-sm overflow-auto">
        {JSON.stringify(details, null, 2)}
      </pre>

      <p>Status: {status}</p>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<p>Loading status…</p>}>
      <StatusContent />
    </Suspense>
  );
}
