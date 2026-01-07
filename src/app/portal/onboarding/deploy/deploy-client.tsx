"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { createRun, executeRun } from "@/lib/api";

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();

  const mode = params.get("mode") ?? "manual";

  const [creating, setCreating] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startRun() {
    setCreating(true);
    setError(null);

    try {
      const res = await createRun(mode, "Onboarding Deployment");
      setRunId(res.run_id);

      await executeRun(res.run_id);

      router.push(`/portal/status?run=${res.run_id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to start deployment");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deploy Infrastructure</h1>
        <p className="text-sm text-slate-400">
          Review configuration and launch Terraform deployment.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="text-sm text-slate-300">
          <strong>Mode:</strong> {mode}
        </div>

        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          onClick={startRun}
          className="w-fit"
        >
          {creating ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Starting…
            </span>
          ) : (
            "Start Deployment"
          )}
        </Button>

        {runId && (
          <p className="text-xs text-slate-400">
            Run created: <code>{runId}</code>
          </p>
        )}
      </Card>
    </div>
  );
}
