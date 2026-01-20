"use client";

import { useMemo, useState } from "react";

import {
  deployPlan,
  deployApprove,
  deployApply,
  type DeployPlanResponse,
  type DeployApplyResponse,
} from "@/lib/api";

type Props = {
  recommendationId: string;
};

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export default function DeployClient({ recommendationId }: Props) {
  const [plan, setPlan] = useState<DeployPlanResponse | null>(null);
  const [apply, setApply] = useState<DeployApplyResponse | null>(null);

  const [runId, setRunId] = useState<string | null>(null);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);

  const [busy, setBusy] = useState<null | "plan" | "apply">(null);
  const [error, setError] = useState<string | null>(null);

  const statusHref = useMemo(() => {
    return runId ? `/portal/status?run=${encodeURIComponent(runId)}` : null;
  }, [runId]);

  async function handlePlan() {
    setError(null);
    setApply(null);
    setPipelineRunId(null);

    try {
      setBusy("plan");

      const res = await deployPlan(
        {
          recommendation_id: recommendationId,
          name_prefix: "zordrax",
          region: "westeurope",
          environment: "dev",
          enable_apim: false,
          backend_app_hostname: "example.azurewebsites.net",
        },
        // idempotency key: safe to re-click plan without creating duplicates (optional)
        `plan:${recommendationId}:${Date.now()}`
      );

      setPlan(res);
      setRunId(res.run_id);
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate terraform plan");
    } finally {
      setBusy(null);
    }
  }

  async function handleApproveAndApply() {
    setError(null);
    setApply(null);

    if (!runId) {
      setError("No runId. Click Generate Terraform Plan first.");
      return;
    }

    try {
      setBusy("apply");

      // approve (supports both backend route styles)
      await deployApprove(runId, `approve:${runId}:${Date.now()}`);

      // apply (supports both backend route styles)
      const res = await deployApply(runId, `apply:${runId}:${Date.now()}`);
      setApply(res);

      const pr = toNumberOrNull(res.pipeline_run_id);
      setPipelineRunId(pr);
    } catch (err: any) {
      setError(err?.message ?? "Failed to approve/apply infrastructure");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePlan}
          disabled={busy !== null}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy === "plan" ? "Planning..." : "Generate Terraform Plan"}
        </button>

        <button
          onClick={handleApproveAndApply}
          disabled={busy !== null || !runId}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy === "apply" ? "Applying..." : "Approve & Apply"}
        </button>

        {statusHref && (
          <a
            href={statusHref}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            View Status
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {(runId || pipelineRunId !== null) && (
        <div className="text-sm text-slate-200">
          {runId && (
            <div>
              <span className="text-slate-400">Run ID:</span>{" "}
              <span className="font-mono">{runId}</span>
            </div>
          )}
          {pipelineRunId !== null && (
            <div>
              <span className="text-slate-400">Pipeline Run:</span>{" "}
              <span className="font-mono">{pipelineRunId}</span>
            </div>
          )}
        </div>
      )}

      {plan && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-100">Plan Response</h3>
          <pre className="overflow-auto text-xs text-slate-200">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>
      )}

      {apply && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-100">Apply Response</h3>
          <pre className="overflow-auto text-xs text-slate-200">
            {JSON.stringify(apply, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
