"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { createRun, executeRun } from "@/lib/api";

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();
  const recId = params.get("rec");

  const [snapshot, setSnapshot] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recId) return;

    const raw = sessionStorage.getItem(`zordrax:rec:${recId}`);
    if (!raw) {
      setError("Recommendation snapshot not found.");
      return;
    }

    setSnapshot(JSON.parse(raw));
  }, [recId]);

  async function startRun() {
    if (!snapshot) return;

    setCreating(true);
    setError(null);

    try {
      const res = await createRun("manual", "Onboarding Deployment");
      await executeRun(res.run_id);
      router.push(`/portal/status?run=${res.run_id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to start deployment");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deploy</h1>
        <p className="text-sm text-slate-400">
          Final review before infrastructure deployment.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {snapshot && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Approved Configuration</h2>
          <pre className="rounded bg-black p-3 text-xs overflow-auto">
            {JSON.stringify(snapshot.final, null, 2)}
          </pre>
        </Card>
      )}

      <Button variant="primary" onClick={startRun}>
        {creating ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Starting…
          </span>
        ) : (
          "Start Deployment"
        )}
      </Button>
    </div>
  );
}
