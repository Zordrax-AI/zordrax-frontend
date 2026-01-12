"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

import {
  deployPlan,
  deployApprove,
  type DeployPlanResponse,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================================================
     PLAN (SAFE)
     ========================================================= */

  async function handlePlan() {
    setLoading(true);
    setError(null);

    try {
      // ✅ CORRECT: pass object matching DeployPlanRequest
      const res: DeployPlanResponse = await deployPlan({
        recommendation_id: recommendationId,
      });

      setRunId(res.run_id);
      setWarnings(res.policy_warnings ?? []);
      setPlanSummary(res.plan_summary);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     APPROVE (APPLY)
     ========================================================= */

  async function handleApprove() {
    if (!runId) return;

    setLoading(true);
    setError(null);

    try {
      await deployApprove(runId);
    } catch (err: any) {
      setError(err.message ?? "Failed to apply infrastructure");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="space-y-4">
      <Button onClick={handlePlan} disabled={loading}>
        Generate Terraform Plan
      </Button>

      {runId && (
        <Button onClick={handleApprove} disabled={loading}>
          Approve & Apply
        </Button>
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
