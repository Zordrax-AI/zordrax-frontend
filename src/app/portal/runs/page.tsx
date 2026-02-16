"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listRuns, type RunRow } from "@/lib/api";

export const dynamic = "force-dynamic";

type Tone = "default" | "info" | "success" | "danger";
type FilterValue = "all" | "running" | "succeeded" | "failed";

export default function RunsPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = runs.length;
    const running = runs.filter((r) => normalizeStatus(r.status) === "running").length;
    const failed = runs.filter((r) => normalizeStatus(r.status) === "failed").length;
    const succeeded = runs.filter((r) => normalizeStatus(r.status) === "succeeded").length;
    return { total, running, failed, succeeded };
  }, [runs]);

  const filteredRuns = useMemo(() => {
    const term = search.trim().toLowerCase();
    return runs.filter((r) => {
      const status = normalizeStatus(r.status);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch = term === "" || String(r.run_id).toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [runs, statusFilter, search]);

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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Runs</h1>
          <div className="text-sm text-[color:var(--muted)]">Deployments and pipeline status</div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total" value={stats.total} tone="default" />
        <Stat label="Running" value={stats.running} tone="info" />
        <Stat label="Succeeded" value={stats.succeeded} tone="success" />
        <Stat label="Failed" value={stats.failed} tone="danger" />
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold">Latest Runs</div>
            <p className="text-xs text-[color:var(--muted)]">Filter by status or search by run_id.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterValue)}
              className="w-full sm:w-44 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            >
              <option value="all">All statuses</option>
              <option value="running">Running</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search run_id"
              className="w-full sm:w-56 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>
        </div>

        {error && <div className="text-sm text-[color:var(--danger)]">{error}</div>}

        {!error && filteredRuns.length === 0 && (
          <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)] space-y-2">
            <div>No runs match your filters.</div>
            <div className="text-xs">Start onboarding to generate a plan, then approve to run Terraform.</div>
            <div className="flex gap-3">
              <Link href="/portal/onboarding">
                <Button variant="primary">Start Onboarding</Button>
              </Link>
              <Link href="/portal">
                <Button variant="outline">Back to Portal</Button>
              </Link>
            </div>
          </div>
        )}

        {filteredRuns.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-[color:var(--muted)]">
                <tr className="border-b border-[color:var(--border)]">
                  <th className="py-2 text-left">Run ID</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Created / Updated</th>
                  <th className="py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((r) => (
                  <tr key={r.run_id} className="border-b border-[color:var(--border)]">
                    <td className="py-2 font-mono text-[color:var(--accent)]">
                      <Link className="hover:underline" href={`/portal/runs/${encodeURIComponent(r.run_id)}`}>
                        {r.run_id}
                      </Link>
                    </td>
                    <td className="py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 text-[color:var(--muted)]">
                      <div>{formatDate(r.created_at)}</div>
                      <div className="text-xs">Updated {formatDate(r.updated_at ?? r.created_at)}</div>
                    </td>
                    <td className="py-2">
                      <Link href={`/portal/runs/${encodeURIComponent(r.run_id)}`}>
                        <Button variant="outline">View</Button>
                      </Link>
                    </td>
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

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: Tone }) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
        <span
          className={`h-2 w-2 rounded-full ${
            tone === "success"
              ? "bg-[color:var(--success)]"
              : tone === "danger"
              ? "bg-[color:var(--danger)]"
              : tone === "info"
              ? "bg-[color:var(--accent)]"
              : "bg-[color:var(--muted)]"
          }`}
        />
        {label}
      </div>
      <div className="text-2xl font-semibold text-[color:var(--fg)]">{value}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: RunRow["status"] }) {
  const normalized = normalizeStatus(status);
  const tone =
    normalized === "succeeded"
      ? "success"
      : normalized === "failed"
      ? "danger"
      : normalized === "running"
      ? "info"
      : "default";
  const label =
    normalized === "succeeded"
      ? "Succeeded"
      : normalized === "failed"
      ? "Failed"
      : normalized === "running"
      ? "Running"
      : String(status ?? "Unknown");
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
        tone === "success"
          ? "border-[color:var(--success)] text-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))]"
          : tone === "danger"
          ? "border-[color:var(--danger)] text-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))]"
          : tone === "info"
          ? "border-[color:var(--accent)] text-[color:var(--accent)] bg-[color:var(--accent-bg,rgba(59,130,246,0.12))]"
          : "border-[color:var(--border)] text-[color:var(--muted)] bg-[color:var(--card-2)]"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function normalizeStatus(status: RunRow["status"]): FilterValue | "unknown" {
  const s = String(status || "").toLowerCase();
  if (s.includes("run")) return "running";
  if (s.includes("fail") || s.includes("error")) return "failed";
  if (s.includes("succ") || s.includes("complete") || s.includes("ok")) return "succeeded";
  return "unknown";
}

function formatDate(value: any) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}
