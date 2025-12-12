"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchRunStatus as fetchStatus } from "@/lib/api";

import type { PipelineStatus } from "@/lib/types";

const STAGES = [
  "queued",
  "initializing",
  "provisioning",
  "terraform_plan",
  "terraform_apply",
  "finalizing",
  "completed",
  "failed"
];

export default function PipRunStatusPage() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [details, setDetails] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function load() {
      try {
        const data = await fetchStatus(runId as string);
        setDetails(data);
      } catch (e: any) {
        setError(e.message);
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId)
    return <p className="text-slate-400 text-sm">Missing ?run= query parameter.</p>;

  if (!details && !error)
    return (
      <div className="flex gap-2 text-sm">
        <Spinner /> Loading pipeline status...
      </div>
    );

  if (error)
    return <p className="text-sm text-rose-400">{error}</p>;

  const currentStage = (details?.stage || "").toLowerCase();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Deployment Status</h1>
      <p className="text-xs text-slate-400">Run #{runId}</p>

      <Card className="space-y-4">
        <div className="flex justify-between">
          <p className="text-sm">{details?.message}</p>
          <Badge>{details?.status}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const active = currentStage === stage;
            const completed =
              STAGES.indexOf(stage) <= STAGES.indexOf(currentStage);

            return (
              <div
                key={stage}
                className={`px-2 py-1 rounded-full text-xs border ${
                  active
                    ? "bg-sky-500/10 text-sky-300 border-sky-500"
                    : completed
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500"
                    : "bg-slate-900 text-slate-400 border-slate-700"
                }`}
              >
                {stage}
              </div>
            );
          })}
        </div>

        {details?.url && (
          <a
            href={details.url}
            target="_blank"
            className="text-sky-300 underline text-xs"
          >
            View Pipeline Logs
          </a>
        )}
      </Card>
    </div>
  );
}
