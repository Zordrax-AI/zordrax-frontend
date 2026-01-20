"use client";

import { useMemo, useState } from "react";

import {
  deployPlan,
  deployApply,
  deployApprove,
  type DeployPlanResponse,
  type DeployApplyResponse,
} from "@/lib/api";

function safeNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type Props = {
  recommendationId?: string;
};

export default function DeployClient({ recommendationId = "test-001" }: Props) {
  const [runId, setRunId] = useState<string>("");
  const [plan, setPlan] = useState<DeployPlanResponse | null>(null);
  const [apply, setApply] = useState<DeployApplyResponse | null>(null);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const prettyPlan = useMemo(
    () => (plan ? JSON.stringify(plan, null, 2) : ""),
    [plan]
  );
  const prettyApply = useMemo(
    () => (apply ? JSON.stringify(apply, null, 2) : ""),
    [apply]
  );

  async function handlePlan() {
    setError("");
    setApply(null);
    setPipelineRunId(null);
    setBusy(true);

    try {
      const res = await deployPlan({
        recommendation_id: recommendationId,
        name_prefix: "zordrax",
        region: "westeurope",
        environment: "dev",
        enable_apim: false,
        backend_app_hostname: "example.azurewebsites.net",
      });

      setPlan(res);
      setRunId(res.run_id);

      try {
        localStorage.setItem("zordrax:last_run_id", res.run_id);
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Plan failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveApply() {
    setError("");
    if (!runId) {
      setError("No run_id yet. Click Generate Terraform Plan first.");
      return;
    }

    setBusy(true);
    try {
      // OPTIONAL approve step — ignore 404 if backend doesn’t implement it
      try {
        await deployApprove(runId);
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        const is404 =
          msg.includes("404") ||
          msg.includes("Not Found") ||
          msg.includes('"detail":"Not Found"');
        if (!is404) throw e;
      }

      const res = await deployApply(runId);
      setApply(res);

      const n = safeNumber(res?.pipeline_run_id);
      if (n !== null) setPipelineRunId(n);
    } catch (e: any) {
      setError(e?.message ?? "Apply failed");
    } finally {
      setBusy(false);
    }
  }

  function handleViewStatus() {
    if (!runId) {
      setError("No run_id yet. Click Generate Terraform Plan first.");
      return;
    }
    window.location.href = `/portal/status?run=${encodeURIComponent(runId)}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handlePlan}
          disabled={busy}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          Generate Terraform Plan
        </button>

        <button
          onClick={handleApproveApply}
          disabled={busy || !runId}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          Approve &amp; Apply
        </button>

        <button
          onClick={handleViewStatus}
          disabled={!runId}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          View Status
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {runId && (
        <div className="text-sm text-slate-200">
          <span className="font-semibold">Run ID:</span> {runId}
          {pipelineRunId !== null && (
            <>
              {" "}
              • <span className="font-semibold">Pipeline Run:</span>{" "}
              {pipelineRunId}
            </>
          )}
        </div>
      )}

      {(plan || apply) && (
        <pre className="max-h-[420px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200">
          {plan ? `Plan Response\n${prettyPlan}\n\n` : ""}
          {apply ? `Apply Response\n${prettyApply}\n` : ""}
        </pre>
      )}
    </div>
  );
}
