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
  saveRecommendationSnapshot, // ✅ MISSING IMPORT (FIX)
} from "@/lib/api";

type RecommendationSnapshot = {
  id: string;
  created_at: string;
  ai: Record<string, any>;
  final: Record<string, any>;
  diff: any[];
  source_query?: Record<string, any>;
};

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

      // 1️⃣ sessionStorage first
      const raw = sessionStorage.getItem(`zordrax:rec:${recId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (!alive) return;
          setSnapshot(parsed);
          return;
        } catch {
          // fallback to backend
        }
      }

      // 2️⃣ backend fallback
      try {
        const rec = await loadRecommendationSnapshot(recId);
        if (!alive) return;

        const rebuilt: RecommendationSnapshot = {
          id: rec.id,
          created_at: rec.created_at,
          ai: rec.ai,
          final: rec.final,
          diff: rec.diff,
          source_query: rec.source_query,
        };

        setSnapshot(rebuilt);
        sessionStorage.setItem(
          `zordrax:rec:${recId}`,
          JSON.stringify(rebuilt)
        );
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
      // 1️⃣ create run
      const res = await createRun("manual", "Onboarding Deployment");

      // 2️⃣ 🔗 attach run_id to recommendation snapshot
      await saveRecommendationSnapshot({
        id: snapshot.id,
        ai: snapshot.ai,
        final: snapshot.final,
        diff: snapshot.diff,
        source_query: snapshot.source_query,
        run_id: res.run_id,
      });

      // 3️⃣ execute infra
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
