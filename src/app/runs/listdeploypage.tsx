"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { fetchRuns } from "@/lib/api";
import type { DeployRun } from "@/lib/types";
import Link from "next/link";

export default function ListDeployPage() {
  const [runs, setRuns] = useState<DeployRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns()
      .then(setRuns)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Deployment Runs</h1>

      <Card>
        {!runs && !error && (
          <div className="flex items-center gap-2 text-sm">
            <Spinner /> Loading deployment runs...
          </div>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {runs && runs.length === 0 && (
          <p className="text-sm text-slate-400">No deployment runs found.</p>
        )}

        {runs && runs.length > 0 && (
          <table className="w-full text-xs mt-2">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2 text-left">Run ID</th>
                <th className="py-2 text-left">Project</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Stage</th>
                <th className="py-2 text-left">Created</th>
              </tr>
            </thead>

            <tbody className="text-slate-200">
              {runs.map((r) => (
                <tr key={r.run_id} className="border-t border-slate-800">
                  <td className="py-2">
                    <Link
                      href={`/wizard/status?run=${r.run_id}`}
                      className="text-sky-300 underline"
                    >
                      {r.run_id}
                    </Link>
                  </td>
                  <td className="py-2">{r.project_name}</td>
                  <td className="py-2"><Badge>{r.status}</Badge></td>
                  <td className="py-2">{r.stage}</td>
                  <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
