"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listRuns, RunRow } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function tone(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return "success";
  if (s === "failed") return "error";
  if (s === "running") return "warning";
  return "default";
}

export default function RunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunRow[]>([]);
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
    return {
      total: runs.length,
      running: runs.filter(r => r.status === "running").length,
      completed: runs.filter(r => r.status === "completed").length,
      failed: runs.filter(r => r.status === "failed").length,
    };
  }, [runs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deployment Runs</h1>
          <p className="text-xs text-slate-400">
            Terraform execution history
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-md border border-slate-800 px-3 py-2 text-xs hover:bg-slate-900"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><Stat label="Total" value={stats.total} /></Card>
        <Card><Stat label="Running" value={stats.running} /></Card>
        <Card><Stat label="Completed" value={stats.completed} /></Card>
        <Card><Stat label="Failed" value={stats.failed} /></Card>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Latest Runs</h2>
          {loading && <Spinner />}
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2 text-left">Run</th>
                <th className="py-2 text-left">Mode</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Stage</th>
                <th className="py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {!loading && runs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-slate-500">
                    No runs yet.
                  </td>
                </tr>
              )}

              {runs.map(r => (
                <tr
                  key={r.run_id}
                  onClick={() =>
                    router.push(`/portal/status?run=${r.run_id}`)
                  }
                  className="cursor-pointer border-b border-slate-900 hover:bg-slate-900/40"
                >
                  <td className="py-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-slate-500">{r.run_id}</div>
                  </td>
                  <td>{r.mode}</td>
                  <td>
                    <Badge tone={tone(r.status)}>{r.status}</Badge>
                  </td>
                  <td>{r.stage}</td>
                  <td className="text-xs text-slate-400">
                    {fmt(r.created_at)}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
