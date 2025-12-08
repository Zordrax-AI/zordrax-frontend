"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface PipelineStatus {
  run_id?: number;
  status?: string;
  stage?: string;
  url?: string;
}

export default function PageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading deployment status...</div>}>
      <DeploymentStatusPage />
    </Suspense>
  );
}

function DeploymentStatusPage() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState<PipelineStatus | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function fetchStatus() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/pipeline/status/${runId}`
        );

        const data: PipelineStatus = await response.json();
        setDetails(data);
        setStatus(data.status ?? "unknown");
      } catch {
        setStatus("error");
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) {
    return <div style={{ padding: 20 }}>Missing run ID.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Deployment Status</h1>
      <pre>{JSON.stringify({ status, details }, null, 2)}</pre>

      {details?.url && (
        <a href={details.url} target="_blank" rel="noopener noreferrer">
          View build in Azure DevOps
        </a>
      )}
    </div>
  );
}
