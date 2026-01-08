"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  createRun,
  executeRun,
  loadRecommendationSnapshot,
  saveRecommendationSnapshot,
} from "@/lib/api";

type Snapshot = {
  id: string;
  created_at: string;
  ai: any;
  final: any;
  diff: any[];
  source_query?: Record<string, string>;
};

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();
  const recId = params.get("rec");

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!recId) {
        setError("Missing ?rec=<id> in URL.");
        return;
      }

      // 1️⃣ Session storage
      const raw = sessionStorage.getItem(`zordrax:rec:${recId}`);
      if (raw) {
        const parsed: Snapshot = JSON.parse(raw);
        if (alive) setSnapshot(parsed);
        return;
      }

      // 2️⃣ Backend fallback
      const rec = await loadRecommendationSnapshot(recId);
      const rebuilt: Snapshot = {
        id: rec.id,
        created_at: rec.created_at,
        ai: rec.ai,
        final: rec.final,
        diff: rec.diff,
        source_query: rec.source_query,
      };

      sessionStorage.setItem(
        `zordrax:rec:${recId}`,
        JSON.stringify(rebuilt)
      );

      if (alive) setSnapshot(rebuilt);
    }

    load().catch((e) => {
      if (alive) setError(e.message || "Failed to load snapshot");
    });

    return () => {
      alive = false;
    };
  }, [recId]);

  async function startRun() {
    if (!snapshot) return;

    setCreating(true);
    setError(null);

    try {
      const { run_id } = await createRun(
        "manual",
        "Onboarding Deployment"
      );

      await saveRecommendationSnapshot({
        id: snapshot.id,
        ai: snapshot.ai,
        final: snapshot.final,
        diff: snapshot.diff,
        source_query: snapshot.source_query,
        run_id,
      });

      await executeRun(run_id);
      router.push(`/portal/status?run=${run_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start deployment");
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

      {!snapshot && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner /> Loading recommendation…
        </div>
      )}

      {snapshot && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">
            Approved Configuration
          </h2>
          <pre className="rounded bg-black p-3 text-xs overflow-auto">
            {JSON.stringify(snapshot.final, null, 2)}
          </pre>
        </Card>
      )}

      <Button
        variant="primary"
        onClick={startRun}
        disabled={!snapshot || creating}
      >
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
