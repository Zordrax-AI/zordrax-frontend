"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDeployStatus } from "@/lib/onboardingConsoleApi";

interface PipelineStatus {
  run_id?: number;
  status?: string;
  stage?: string;
  message?: string;
  url?: string;
}

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

  // ❌ Cannot use `any`
  // ✔ Use a proper type or null
  const [details, setDetails] = useState<PipelineStatus | null>(null);
  const [status, setStatus] = useState("loading");

  // We CANNOT early-return before hooks
  const isMissingRunId = !runId;

  useEffect(() => {
    if (!runId) return;

    async function load() {
      try {
        const data = await getDeployStatus(runId);
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

  // ✔ Now we return AFTER all hooks have run
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
