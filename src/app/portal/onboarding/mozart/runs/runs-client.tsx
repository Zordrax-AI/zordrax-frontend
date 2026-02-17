"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { client } from "@/lib/agent";

type RunRow = {
  run_id: string;
  status?: string;
  created_at?: string;
};

export default function RunsClient() {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await client.listRuns(50);
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res.items as any[]) || [];
        setRows(list);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load runs");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase text-slate-500 font-semibold">Runs</div>
        <div className="text-2xl font-semibold text-slate-900">Recent deploy runs</div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Card className="p-4 bg-white border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-2">Run ID</th>
              <th className="py-2">Status</th>
              <th className="py-2">Created</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-slate-500" colSpan={4}>
                  No runs yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.run_id}>
                <td className="py-2 font-mono text-xs text-slate-900">{r.run_id}</td>
                <td className="py-2 text-slate-700">{r.status || "--"}</td>
                <td className="py-2 text-slate-600">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "--"}
                </td>
                <td className="py-2 text-right">
                  <Link
                    className="text-cyan-600 hover:underline text-sm"
                    href={`/portal/onboarding/mozart/run?run_id=${encodeURIComponent(r.run_id)}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
