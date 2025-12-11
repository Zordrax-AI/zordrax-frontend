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
  const runIdParam = params.get("run");
  const runId = runIdParam ?? ""; // always a string for the API
  const isMissingRunId = !runIdParam;

  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!runId) return;

    async function load() {
      try {
        const data = await getDeployStatus(runId);
        setDetails(data as unknown as Record<string, unknown>);
        setStatus((data as { status?: string }).status ?? "unknown");
      } catch {
        setStatus("error");
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (isMissingRunId) {
    return <p>No pipeline run ID found.</p>;
  }

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
