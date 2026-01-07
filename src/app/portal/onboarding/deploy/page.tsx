// src/app/portal/onboarding/deploy/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { createRun, executeRun } from "@/lib/api";

type Recommendation = {
  cloud: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
  region: string;
  env: string;
};

type Snapshot = {
  id: string;
  created_at: string;
  ai_snapshot: Recommendation;
  final: Recommendation;
  diff: Array<{
    key: keyof Recommendation;
    label: string;
    before: string;
    after: string;
    changed: boolean;
  }>;
  source_query: Record<string, string>;
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function DeployPage() {
  const router = useRouter();
  const params = useSearchParams();
  const recId = params.get("rec");

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [title, setTitle] = useState("Onboarding Deploy");
  const [mode, setMode] = useState("manual");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changedCount = useMemo(() => {
    return snapshot?.diff?.filter((d) => d.changed).length ?? 0;
  }, [snapshot]);

  useEffect(() => {
    setError(null);

    if (!recId) {
      setSnapshot(null);
      return;
    }

    const key = `zordrax:rec:${recId}`;
    const loaded = safeJsonParse<Snapshot>(sessionStorage.getItem(key));

    if (!loaded) {
      setSnapshot(null);
      setError(
        "Recommendation snapshot not found (sessionStorage). Go back and Approve again."
      );
      return;
    }

    setSnapshot(loaded);

    // Try to set mode/title from the originating query, if present
    const m = loaded.source_query?.mode || "manual";
    setMode(m);
    setTitle(
      `Deploy (${m}) • ${loaded.final.cloud}/${loaded.final.region} • ${loaded.final.warehouse}`
    );
  }, [recId]);

  async function startRun() {
    setError(null);

    if (!snapshot) {
      setError("Missing recommendation snapshot. Go back to Recommend.");
      return;
    }

    setCreating(true);
    try {
      // Backend run is still "manual" mode for now; you can pass ai/manual later
      const created = await createRun(mode, title);

      // Optional: you can later POST snapshot.final to backend here (Option C.3.2)
      // For now, we only run Terraform via existing endpoints.
      await executeRun(created.run_id);

      router.push(`/portal/status?run=${encodeURIComponent(created.run_id)}`);
    } catch (e: any) {
      setError(e?.message || "Failed to start run");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Deploy</h1>
          <p className="mt-1 text-sm text-slate-400">
            Uses your existing backend run engine. Recommendation is currently
            frontend-only (snapshot in sessionStorage).
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/portal/onboarding/recommend")}>
            Back
          </Button>
          <Button variant="outline" onClick={() => router.push("/portal/runs")}>
            Run History
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Run Details</h2>
            <p className="mt-1 text-xs text-slate-400">
              This creates a backend run and executes Terraform.
            </p>
          </div>

          <div className="space-y-3">
            <Field label="Mode">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none"
              >
                <option value="manual">manual</option>
                <option value="ai">ai</option>
              </select>
            </Field>

            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </Field>

            <Button variant="primary" onClick={startRun} disabled={creating}>
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Starting…
                </span>
              ) : (
                "Create & Execute"
              )}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Recommendation Snapshot
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Overridden fields:{" "}
              <span className={changedCount ? "text-amber-300" : "text-emerald-300"}>
                {changedCount}
              </span>
            </p>
          </div>

          {!snapshot ? (
            <div className="text-sm text-slate-400">
              No snapshot loaded. Go back to Recommend and click “Approve & Continue”.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-400">Final Architecture</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <KV k="Cloud" v={snapshot.final.cloud} />
                  <KV k="Region" v={snapshot.final.region} />
                  <KV k="Env" v={snapshot.final.env} />
                  <KV k="Warehouse" v={snapshot.final.warehouse} />
                  <KV k="ETL" v={snapshot.final.etl} />
                  <KV k="BI" v={snapshot.final.bi} />
                  <KV k="Governance" v={snapshot.final.governance} />
                </div>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-400">Diff Summary (AI → Final)</div>
                <div className="mt-2 space-y-1 text-xs font-mono">
                  {snapshot.diff
                    .filter((d) => d.changed)
                    .map((d) => (
                      <div key={String(d.key)} className="text-amber-200">
                        {d.label}: {d.before} → {d.after}
                      </div>
                    ))}

                  {snapshot.diff.filter((d) => d.changed).length === 0 ? (
                    <div className="text-emerald-200">No changes — using AI baseline as-is.</div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-400">{label}</div>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-black/30 px-3 py-2">
      <div className="text-[11px] text-slate-500">{k}</div>
      <div className="text-sm text-slate-100">{v}</div>
    </div>
  );
}
