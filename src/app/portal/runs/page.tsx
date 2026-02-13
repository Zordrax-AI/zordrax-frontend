"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listRuns, type RunRow } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function RunsPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [jumpId, setJumpId] = useState("");

  const stats = useMemo(() => {
    const total = runs.length;
    const running = runs.filter((r) => String(r.status).toLowerCase().includes("running")).length;
    const failed = runs.filter((r) => String(r.status).toLowerCase().includes("failed")).length;
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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deployment Runs</h1>
          <div className="text-sm text-[color:var(--muted)]">Terraform execution history</div>
        </div>

        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Running" value={stats.running} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Failed" value={stats.failed} />
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={jumpId}
            onChange={(e) => setJumpId(e.target.value)}
            placeholder="Enter run_id to open"
            className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          />
          <Link href={jumpId ? `/portal/runs/${encodeURIComponent(jumpId)}` : "#"}>
            <Button variant="primary" disabled={!jumpId}>
              Open run
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Latest Runs</div>

        {error && <div className="text-sm text-[color:var(--danger)]">{error}</div>}

        {!error && runs.length === 0 && (
          <div className="space-y-2">
            <div className="text-sm text-[color:var(--muted)]">No deployments yet.</div>
            <div className="text-xs text-[color:var(--muted)]">
              Start onboarding to generate a deploy plan, then approve to run Terraform.
            </div>
            <Link href="/portal/onboarding">
              <Button variant="primary">Start onboarding</Button>
            </Link>
          </div>
        )}

        {runs.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-[color:var(--muted)]">
                <tr className="border-b border-[color:var(--border)]">
                  <th className="py-2 text-left">Run</th>
                  <th className="py-2 text-left">Mode</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Stage</th>
                  <th className="py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.run_id} className="border-b border-[color:var(--border)]">
                    <td className="py-2 font-mono text-[color:var(--accent)]">
                      <Link className="hover:underline" href={`/portal/runs/${encodeURIComponent(r.run_id)}`}>
                        {r.run_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2">{r.mode}</td>
                    <td className="py-2">{r.status}</td>
                    <td className="py-2">{r.stage}</td>
                    <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-[color:var(--muted)]">{label}</div>
      <div className="text-2xl font-semibold text-[color:var(--fg)]">{value}</div>
    </Card>
  );
}
