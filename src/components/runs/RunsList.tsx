"use client";

import { useEffect, useState } from "react";

type Run = {
  run_id: string;
  status: string;
  stage?: string;
  created_at?: string;
};

function StatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs border";

  const cls =
    status === "completed"
      ? "border-emerald-500/40 text-emerald-300"
      : status === "failed"
      ? "border-rose-500/40 text-rose-300"
      : status === "canceled"
      ? "border-amber-500/40 text-amber-300"
      : status === "cancel_requested"
      ? "border-amber-500/40 text-amber-300"
      : "border-slate-700 text-slate-300";

  return <span className={`${base} ${cls}`}>{status}</span>;
}

export default function RunsList() {
  const base = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!base) {
      setError("NEXT_PUBLIC_ONBOARDING_API_URL not configured");
      return;
    }
    try {
      const res = await fetch(`${base}/api/runs`, { cache: "no-store" });
      const data = await res.json();
      setRuns(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load runs");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000); // ✅ auto refresh
    return () => clearInterval(t);
  }, []);

  if (error) {
    return <div className="p-6 text-rose-300">{error}</div>;
  }

  return (
    <div className="space-y-3">
      {runs.map((r) => (
        <a
          key={r.run_id}
          href={`/runs/${r.run_id}`}
          className="block rounded border border-slate-800 p-3 hover:bg-slate-900 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-mono">{r.run_id}</div>
            <StatusBadge status={r.status} />
          </div>
          <div className="mt-1 text-xs opacity-70">Stage: {r.stage ?? "-"}</div>
        </a>
      ))}
    </div>
  );
}
