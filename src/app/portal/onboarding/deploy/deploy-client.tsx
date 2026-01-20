"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

  function goToStatus() {
    if (!runId) return;
    router.push(`/portal/status?run=${encodeURIComponent(runId)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button onClick={handlePlan} disabled={loading}>
          Generate Terraform Plan
        </Button>

        <Button onClick={handleApproveAndApply} disabled={loading || !runId}>
          Approve & Apply
        </Button>

        <Button onClick={goToStatus} disabled={!runId}>
          View Status
        </Button>
      </div>

      {pipelineRunId && (
        <div className="rounded border border-green-500 p-3 text-green-700">
          Pipeline triggered. Run ID: <b>{pipelineRunId}</b>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded border border-yellow-400 p-3">
          <h3 className="font-semibold text-yellow-700">Policy Warnings</h3>
          <ul className="list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {planSummary && (
        <pre className="rounded bg-gray-100 p-3 text-sm overflow-auto">
          {JSON.stringify(planSummary, null, 2)}
        </pre>
      )}

      {error && (
        <div className="rounded border border-red-500 p-3 text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
