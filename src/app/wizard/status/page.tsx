"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeploymentStatusPage() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!runId) return;

    async function fetchStatus() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/pipeline/status/${runId}`
        );

        const data = await res.json();
        setDetails(data);
        setStatus(data.status || "unknown");
      } catch (e) {
        setStatus("error");
      }
    }

    fetchStatus();

    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);

  }, [runId]);

  if (!runId) {
    return <div>No run ID provided.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Deployment Status</h1>

      <pre>{JSON.stringify({ status, details }, null, 2)}</pre>

      {details?.url && (
        <a 
          href={details.url} 
          target="_blank"
          style={{ color: "lightblue" }}
        >
          View Pipeline in Azure DevOps
        </a>
      )}
    </div>
  );
}
