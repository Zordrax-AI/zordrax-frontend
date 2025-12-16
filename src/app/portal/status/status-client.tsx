"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getRunStatus, type ZordraxRun } from "@/lib/agent";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function WizardStatusClient() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [run, setRun] = useState<ZordraxRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      setError("Missing run id");
      return;
    }

    (async () => {
      try {
        const r = await getRunStatus(runId);
        setRun(r);
      } catch (e: any) {
        setError(e?.message || "Failed to load run");
      }
    })();
  }, [runId]);

  if (error) {
    return (
      <Card>
        <div className="text-sm text-red-300">{error}</div>
      </Card>
    );
  }

  if (!run) {
    return (
      <Card>
        <div className="text-sm text-slate-400">Loading run…</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Wizard Run Status</h1>
        <Badge>{run.status}</Badge>
        <div className="text-sm text-slate-400">Stage: {run.stage}</div>
      </div>
    </Card>
  );
}
