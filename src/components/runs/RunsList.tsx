"use client";

import { useEffect, useState } from "react";
import { listRuns, type RunRow } from "@/lib/api";

import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import { CancelRunButton } from "@/components/runs/CancelRunButton";

export default function RunsList() {
  const [runs, setRuns] = useState<RunRow[]>([]);

  useEffect(() => {
    listRuns().then(setRuns);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th>Status</th>
            <th>Stage</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {runs.map((r) => (
            <tr
              key={r.run_id}
              className="border-t border-slate-800 hover:bg-slate-900/50"
            >
              <td className="px-4 py-3">{r.title}</td>
              <td>
                <RunStatusBadge status={r.status} />
              </td>
              <td>{r.stage}</td>
              <td className="text-xs text-slate-400">
                {r.created_at
                  ? new Date(r.created_at).toLocaleString()
                  : "—"}
              </td>
              <td className="px-4">
                <CancelRunButton runId={r.run_id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
