"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchStatus } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function load() {
      try {
        const data = await fetchStatus(runId);
        setDetails(data);
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [runId]);

  if (!runId) return <p className="text-sm text-slate-400">Missing ?run= parameter.</p>;

  if (loading) {
    return (
      <div className="flex gap-2 text-sm">
        <Spinner /> Loading pipeline status...
      </div>
    );
  }

  if (error) {
    return <p className="text-rose-400 text-sm">{error}</p>;
  }

  const currentStage = (details?.stage || "").toLowerCase();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pipeline Status</h1>
      <p className="text-xs text-slate-400">Run #{runId}</p>

      <Card className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm">{details?.message || "Processing..."}</p>
          <Badge>{details?.status || details?.stage}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const active = currentStage === stage;
            const completed = STAGES.indexOf(stage) <= STAGES.indexOf(currentStage);

            return (
              <div
                key={stage}
                className={`px-2 py-1 rounded-full text-xs border ${
                  active
                    ? "border-sky-500 bg-sky-500/10 text-sky-300"
                    : completed
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-400"
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
            View logs
          </a>
        )}
      </Card>
    </div>
  );
}
