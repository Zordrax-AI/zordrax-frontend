"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchRunStatus } from "@/lib/api";
import type { PipelineStatus } from "@/lib/types";

export default function StatusPageInner() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [details, setDetails] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function load() {
      try {
        const data = await fetchRunStatus(runId);
        setDetails(data);
      } catch (e: any) {
        setError(e.message);
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) return <p className="text-slate-400 text-sm">Missing ?run.</p>;
  if (!details && !error)
    return (
      <div className="flex gap-2 text-sm">
        <Spinner /> Loading pipeline status...
      </div>
    );
  if (error) return <p className="text-sm text-rose-400">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Deployment Status</h1>
      <p className="text-xs text-slate-400">Run #{runId}</p>

      <Card className="space-y-4">
        <div className="flex justify-between">
          <p className="text-sm">{details?.message}</p>
          <Badge>{details?.status}</Badge>
        </div>
      </Card>
    </div>
  );
}
