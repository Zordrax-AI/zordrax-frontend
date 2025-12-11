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
    fetchRuns().then(setRuns).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Deployment Runs</h1>

      <Card>
        {!runs && !error && (
          <div className="flex gap-2 text-sm">
            <Spinner /> Loading runs...
          </div>
        )}

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        {runs && runs.length === 0 && (
          <p className="text-slate-400 text-sm">No deployment runs found.</p>
        )}

        {runs && runs.length > 0 && (
          <table className="w-full text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2 text-left">Run</th>
                <th className="py-2 text-left">Project</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Stage</th>
              </tr>
            </thead>

            <tbody className="text-slate-200">
              {runs.map((run) => (
                <tr key={run.run_id} className="border-t border-slate-800">
                  <td className="py-2">
                    <Link href={`/wizard/status?run=${run.run_id}`} className="text-sky-300 underline">
                      {run.run_id}
                    </Link>
                  </td>
                  <td className="py-2">{run.project_name}</td>
                  <td className="py-2">
                    <Badge>{run.status}</Badge>
                  </td>
                  <td className="py-2">{run.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
