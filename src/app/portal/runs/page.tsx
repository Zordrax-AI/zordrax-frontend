"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { listRuns } from "@/lib/api";

export type ZordraxRun = {
  run_id: string;
  title: string;
  mode: string;
  status: string;
  stage: string;
  created_at: string;
};

function fmtTs(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return "success";
  if (s === "failed") return "error";
  if (s === "running") return "warning";
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
      const data = await listRuns();
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
    const out = { total: 0, running: 0, completed: 0, failed: 0 };
    out.total = runs.length;
    for (const r of runs) {
      if (r.status in out) (out as any)[r.status]++;
    }
    return out;
  }, [runs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deployment Runs</h1>
          <p className="text-xs text-slate-400">
            Terraform execution history.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-md border border-slate-800 px-3 py-2 text-xs"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}>
            <p className="text-xs text-slate-400 capitalize">{k}</p>
            <p className="text-2xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Spinner /> Loading…
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-900 text-left text-xs text-slate-400">
                <th>Run</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.run_id} className="border-b border-slate-950">
                  <td>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-slate-500">{r.run_id}</div>
                  </td>
                  <td className="text-xs">{r.mode}</td>
                  <td>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="text-xs">{r.stage}</td>
                  <td className="text-xs text-slate-400">
                    {fmtTs(r.created_at)}
                  </td>
                  <td>
                    <Link
                      href={`/portal/status?run=${r.run_id}`}
                      className="text-xs underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-400">
                    No runs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
