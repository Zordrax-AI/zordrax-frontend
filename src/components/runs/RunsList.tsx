"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listRuns, RunRow } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

function statusTone(status: string) {
  const s = status?.toLowerCase();
  if (s === "completed") return "success";
  if (s === "failed") return "error";
  if (s === "running") return "warning";
  return "default";
}

export default function RunsList() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listRuns();
    setRuns(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent Runs</h2>
        {loading && <Spinner />}
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          {runs.map((r) => (
            <tr key={r.run_id} className="border-t border-slate-800">
              <td className="py-2">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-slate-500">{r.run_id}</div>
              </td>
              <td>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </td>
              <td>
                <Link
                  href={`/portal/status?run=${r.run_id}`}
                  className="text-xs underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
