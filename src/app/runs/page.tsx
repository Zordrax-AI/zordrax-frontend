"use client";

import { useEffect, useState } from "react";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";

export default function RunsIndex() {
  const base = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    if (!base) return;

    const load = async () => {
      const res = await fetch(`${base}/api/runs`);
      setRuns(await res.json());
    };

    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [base]);

  return (
    <div className="p-6 space-y-2">
      {runs.map(r => (
        <a
          key={r.run_id}
          href={`/runs/${r.run_id}`}
          className="flex justify-between border rounded p-3 hover:bg-slate-800"
        >
          <span className="font-mono text-xs">{r.run_id}</span>
          <RunStatusBadge status={r.status} />
        </a>
      ))}
    </div>
  );
}
