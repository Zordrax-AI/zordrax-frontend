"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { StatusPill } from "@/components/StatusPill";
import { refreshRun } from "@/lib/api";
import { RunStatus } from "@/lib/types";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run" },
];

const TIMELINE = ["awaiting_approval", "plan_generated", "infra_triggered", "infra_succeeded", "failed"];

export default function RunPage() {
  const params = useParams<{ run_id: string }>();
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runId = params.run_id;

  const fetchStatus = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await refreshRun(runId);
      setStatus(res);
      setMessage(null);
    } catch (err: any) {
      setMessage(err.message || "Refresh failed");
    }
  }, [runId]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(() => {
      fetchStatus();
    }, 3000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const currentIdx = useMemo(() => {
    if (!status) return 0;
    const idx = TIMELINE.indexOf(status.current_status?.toLowerCase?.());
    return idx >= 0 ? idx : 0;
  }, [status]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <Stepper steps={STEPS} current="run" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Run status</h1>
          <div className="text-sm text-[color:var(--muted)]">Run ID: {runId}</div>
        </div>
        <button
          onClick={fetchStatus}
          className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm"
        >
          Manual refresh
        </button>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Current</span>
          {status?.current_status && <StatusPill status={status.current_status} />}
          {status?.last_updated && <span className="text-xs text-[color:var(--muted)]">Updated {status.last_updated}</span>}
        </div>
        <ol className="flex flex-wrap gap-3">
          {TIMELINE.map((step, idx) => {
            const isDone = idx <= currentIdx;
            return (
              <li
                key={step}
                className={`px-3 py-2 rounded-md border text-sm ${
                  isDone
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100"
                    : "border-[color:var(--border)] text-[color:var(--muted)]"
                }`}
              >
                {step}
              </li>
            );
          })}
        </ol>

        {status?.outputs && (
          <pre className="text-xs bg-[color:var(--card-2)] rounded-md p-3 overflow-auto">
            {JSON.stringify(status.outputs, null, 2)}
          </pre>
        )}

        {message && <div className="text-sm text-red-500">{message}</div>}
      </div>
    </div>
  );
}
