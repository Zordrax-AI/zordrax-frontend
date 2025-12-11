"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDeployStatus } from "@/lib/onboardingConsoleApi";

export default function StatusPage() {
  return (
    <Suspense fallback={<p>Loading status…</p>}>
      <StatusContent />
    </Suspense>
  );
}

function StatusContent() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [details, setDetails] = useState<any>(null);
  const [status, setStatus] = useState("loading");

  // ---- FIX: ensure runId is string, not null ----
  if (!runId) {
    return <p>No pipeline run ID found.</p>;
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeployStatus(runId as string); // FIX
        setDetails(data);
        setStatus(data?.status ?? "unknown");
      } catch {
        setStatus("error");
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [runId]);

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
