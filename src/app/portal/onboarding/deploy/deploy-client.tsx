// C:\Users\Zordr\Desktop\frontend-repo\src\app\portal\onboarding\deploy\deploy-client.tsx
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
  type RecommendationSnapshot,
} from "@/lib/api";

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();
  const recId = params.get("rec");

  const [snapshot, setSnapshot] = useState<RecommendationSnapshot | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!recId) {
        setError("Missing ?rec=<id> in URL.");
        return;
      }

      // 1) Try sessionStorage
      const raw = sessionStorage.getItem(`zordrax:rec:${recId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (!alive) return;
          setSnapshot(parsed);
          return;
        } catch {
          // fall through
        }
      }

      // 2) Fallback to backend
      try {
        const rec = await loadRecommendationSnapshot(recId);
        if (!alive) return;
        setSnapshot(rec);
        sessionStorage.setItem(`zordrax:rec:${recId}`, JSON.stringify(rec));
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Recommendation snapshot not found.");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [recId]);

  async function startRun() {
    if (!snapshot) return;

    setCreating(true);
    setError(null);

    try {
      // Create run
      const res = await createRun("manual", "Onboarding Deployment");

      // Bind run_id to snapshot (both local + backend)
      const updated: RecommendationSnapshot = {
        ...snapshot,
        run_id: res.run_id,
      };

      sessionStorage.setItem(`zordrax:rec:${snapshot.id}`, JSON.stringify(updated));
      setSnapshot(updated);

      try {
        await saveRecommendationSnapshot(updated);
      } catch (e) {
        console.warn("Snapshot update failed (non-blocking):", e);
      }

      // Execute infra
      await executeRun(res.run_id);

      router.push(`/portal/status?run=${encodeURIComponent(res.run_id)}`);
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

      {error ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {!snapshot && !error ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner /> Loading recommendation…
        </div>
      ) : null}

      {snapshot ? (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Approved Configuration</h2>
          <pre className="rounded bg-black p-3 text-xs overflow-auto">
            {JSON.stringify(snapshot.final, null, 2)}
          </pre>
          {snapshot.run_id ? (
            <div className="mt-3 text-xs text-slate-400">
              Bound run_id: <span className="text-slate-200 font-mono">{snapshot.run_id}</span>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Button
        variant="primary"
        onClick={startRun}
        className={!snapshot || creating ? "opacity-50 pointer-events-none" : ""}
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
