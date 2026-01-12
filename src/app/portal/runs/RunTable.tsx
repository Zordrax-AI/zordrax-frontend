"use client";

import { useEffect, useState } from "react";

import { listRuns, type RunRow } from "@/lib/api";
import RunRowActions from "./RunRowActions";

/* =========================================================
   Helpers
========================================================= */

function fmt(ts?: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

/* =========================================================
   Component
========================================================= */

export default function RunTable() {
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
          {runs.map((run) => (
            <tr
              key={run.run_id}
              className="border-t border-slate-800 hover:bg-slate-900/50"
            >
              <td className="px-4 py-3">
                {run.title ?? "Run"}
              </td>
              <td>{run.status}</td>
              <td>{run.stage ?? "—"}</td>
              <td className="text-xs text-slate-400">
                {fmt(run.created_at)}
              </td>
              <td className="px-4">
                <RunRowActions run={run} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
