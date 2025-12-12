"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  fetchRuns,
  fetchObservabilityOverview,
} from "@/lib/api";
import type {
  PipelineRun,
  ObservabilityOverview,
  RunHistoryResponse,
} from "@/lib/types";

function statusColour(result?: string | null) {
  const val = (result || "").toLowerCase();
  if (val === "succeeded") return "bg-emerald-500/10 text-emerald-300 border-emerald-500";
  if (val === "failed") return "bg-rose-500/10 text-rose-300 border-rose-500";
  return "bg-slate-700/40 text-slate-200 border-slate-600";
}

export default function RunsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [overview, setOverview] = useState<ObservabilityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [historyRes, overviewRes] = await Promise.all([
          fetchRuns(),
          fetchObservabilityOverview(),
        ]);

        const history = historyRes as RunHistoryResponse;
        setRuns(history.items ?? []);
        setOverview(overviewRes as ObservabilityOverview);
      } catch (e: any) {
        setError(e.message ?? "Failed to load deployment runs.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Deployment Runs</h1>
        <p className="text-xs text-slate-400">
          Azure DevOps build history for the Zordrax pipelines.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Total runs</p>
            <p className="text-2xl font-semibold">
              {overview?.total_runs ?? "–"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Succeeded</p>
            <p className="text-2xl font-semibold text-emerald-300">
              {overview?.succeeded_runs ?? "–"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Failed</p>
            <p className="text-2xl font-semibold text-rose-300">
              {overview?.failed_runs ?? "–"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Running / active</p>
            <p className="text-2xl font-semibold text-sky-300">
              {overview?.running_runs ?? "0"}
            </p>
          </div>
        </Card>
      </div>

      {/* Last run highlight */}
      {overview?.last_run && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1">Last run</p>
            <p className="text-sm">
              #{overview.last_run.id} —{" "}
              <span className="text-slate-300">
                {new Date(overview.last_run.created).toLocaleString()}
              </span>
            </p>
          </div>
          <a
            href={overview.last_run.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-300 underline"
          >
            View in Azure DevOps
          </a>
        </Card>
      )}

      {/* Runs table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Recent runs
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner /> Loading...
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-400">
            {error}
          </p>
        )}

        {!loading && !error && runs.length === 0 && (
          <p className="text-sm text-slate-400">
            No deployment runs found.
          </p>
        )}

        {!loading && !error && runs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-800">
                  <th className="text-left py-2 pr-4">Run</th>
                  <th className="text-left py-2 pr-4">State</th>
                  <th className="text-left py-2 pr-4">Result</th>
                  <th className="text-left py-2 pr-4">Created</th>
                  <th className="text-left py-2">Link</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-slate-900/60 last:border-0"
                  >
                    <td className="py-2 pr-4 text-slate-200">
                      #{run.id}
                    </td>
                    <td className="py-2 pr-4 text-slate-200">
                      {run.state}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${statusColour(
                          run.result
                        )}`}
                      >
                        {run.result || "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-300">
                      {new Date(run.created).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <a
                        href={run.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-300 underline"
                      >
                        View logs
                      </a>
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
