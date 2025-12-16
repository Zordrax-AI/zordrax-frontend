"use client";

import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const runId = sessionStorage.getItem("run_id");
    if (!runId) return;

    const timer = setInterval(() => {
      fetch(`${BASE}/pipeline/status/${runId}`)
        .then((r) => r.json())
        .then(setStatus);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  if (!status) return <div>Loading deployment status…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Deployment Status</h2>

      <pre className="rounded-md bg-slate-900 p-4 text-xs">
        {JSON.stringify(status, null, 2)}
      </pre>
    </div>
  );
}
