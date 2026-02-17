"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { listRuns, type RunRow } from "@/lib/api";

export default function RunsClient() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const total = runs.length;
    const running = runs.filter((r) =>
      String(r.status).toLowerCase().includes("running")
    ).length;
    const failed = runs.filter((r) =>
      String(r.status).toLowerCase().includes("failed")
    ).length;
    const completed = total - running - failed;
    return { total, running, failed, completed };
  }, [runs]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listRuns();
      setRuns(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deployment Runs</h1>
          <div className="text-sm text-slate-400">
            Terraform execution history
          </div>
        </div>

        <button
          onClick={refresh}
          className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-white/5"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Running" value={stats.running} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Failed" value={stats.failed} />
      </div>

      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Latest Runs</h2>

        {error && <div className="text-sm text-red-300">{error}</div>}

        {!error && runs.length === 0 && (
          <div className="text-sm text-slate-400">No runs yet.</div>
        )}

        {runs.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="py-2 text-left">Run</th>
                  <th className="py-2 text-left">Mode</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Stage</th>
                  <th className="py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.run_id} className="border-b border-slate-900">
                    <td className="py-2 font-mono text-cyan-300">
                      <Link
                        className="hover:underline"
                        href={`/portal/runs/${encodeURIComponent(r.run_id)}`}
                      >
                        {r.run_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2">{r.mode}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2">{r.stage}</td>
                  <td className="py-2">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
