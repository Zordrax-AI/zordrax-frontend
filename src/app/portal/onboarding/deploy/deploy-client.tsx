"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

import {
  deployPlan,
  deployApprove,
  deployApply,
  type DeployPlanResponse,
  type DeployApplyResponse,
} from "@/lib/api";

export default function DeployClient({
  recommendationId,
}: {
  recommendationId: string;
}) {
  const [runId, setRunId] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [planSummary, setPlanSummary] = useState<Record<string, unknown> | null>(
    null
  );
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function idemKey(prefix: string, id?: string | null) {
    return id ? `${prefix}:${id}` : `${prefix}:${recommendationId}`;
  }

  async function handlePlan() {
    setLoading(true);
    setError(null);
    setPipelineRunId(null);

    try {
      const res: DeployPlanResponse = await deployPlan(
        { recommendation_id: recommendationId },
        idemKey("deploy-plan")
      );

      setRunId(res.run_id);
      setWarnings(res.policy_warnings ?? []);
      setPlanSummary(res.plan_summary);
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveAndApply() {
    if (!runId) return;

    setLoading(true);
    setError(null);

    try {
      await deployApprove(runId, idemKey("deploy-approve", runId));

      const res: DeployApplyResponse = await deployApply(
        runId,
        idemKey("deploy-apply", runId)
      );

      if (res?.pipeline_run_id) {
        setPipelineRunId(res.pipeline_run_id);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to approve/apply infrastructure");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button onClick={handlePlan} disabled={loading}>
          Generate Terraform Plan
        </Button>

        {runId && (
          <Button onClick={handleApproveAndApply} disabled={loading}>
            Approve &amp; Apply
          </Button>
        )}

        {runId && (
          <Link
            href={`/portal/status?run=${encodeURIComponent(runId)}`}
            className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
          >
            Open Status
          </Link>
        )}
      </div>

      {pipelineRunId && (
        <div className="rounded border border-green-600/60 bg-green-950/20 p-3 text-green-300">
          Pipeline triggered. ADO Run ID: <b>{pipelineRunId}</b>
          {runId ? (
            <div className="mt-1 text-xs text-green-300/80 font-mono break-all">
              SSOT Run UUID: {runId}
            </div>
          ) : null}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded border border-yellow-600/50 bg-yellow-950/20 p-3">
          <h3 className="font-semibold text-yellow-300">Policy Warnings</h3>
          <ul className="mt-2 list-disc pl-5 text-yellow-200/90">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {planSummary && (
        <pre className="rounded bg-slate-950/40 border border-slate-800 p-3 text-xs overflow-auto text-slate-200">
          {JSON.stringify(planSummary, null, 2)}
        </pre>
      )}

      {error && (
        <div className="rounded border border-red-600/60 bg-red-950/20 p-3 text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
