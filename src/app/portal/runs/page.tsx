"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { listRuns, type ZordraxRun } from "@/lib/agent";

function fmtTs(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function statusTone(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "success";
  if (s === "failed") return "error";
  if (s === "running" || s === "in_progress") return "warning";
  if (s === "queued") return "default";
  return "default";
}

export default function RunsPage() {
  const [runs, setRuns] = useState<ZordraxRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listRuns(50, 0);
      setRuns(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const out = {
      total: runs.length,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };
    for (const r of runs) {
      const s = (r.status || "").toLowerCase();
      if (s in out) (out as any)[s] += 1;
    }
    return out;
  }, [runs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Deployment Runs</h1>
          <p className="text-xs text-slate-400">
            Zordrax Onboarding Agent run history (from the backend /runs API).
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs hover:bg-slate-900"
        >
          Refresh
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Queued</p>
            <p className="text-2xl font-semibold">{stats.queued}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Running</p>
            <p className="text-2xl font-semibold">{stats.running}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-2xl font-semibold">{stats.completed}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Failed</p>
            <p className="text-2xl font-semibold">{stats.failed}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Latest Runs</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner /> Loading…
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
            <div className="mt-2 text-xs text-red-200/80">
              Tip: ensure NEXT_PUBLIC_API_BASE_URL is set in Vercel and your backend
              has CORS_ALLOW_ORIGINS including this Vercel domain.
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-900 text-left text-xs text-slate-400">
                <th className="py-2 pr-4">Run</th>
                <th className="py-2 pr-4">Mode</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Open</th>
              </tr>
            </thead>
            <tbody>
              {!loading && runs.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={6}>
                    No runs yet. Start one from Portal → AI or Manual.
                  </td>
                </tr>
              ) : null}

              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-950">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-slate-500">{r.id}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-slate-300">{r.mode}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-slate-300">{r.stage}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-slate-400">
                      {fmtTs(r.created_at)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      className="text-xs underline text-slate-200 hover:text-white"
                      href={`/portal/status?run=${encodeURIComponent(r.id)}`}
                    >
                      View status
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
