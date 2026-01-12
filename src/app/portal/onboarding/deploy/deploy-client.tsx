"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { deployPlan, deployApprove } from "@/lib/api";

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();
  const recId = params.get("rec");

  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [approving, setApproving] = useState(false);

  const [runId, setRunId] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [planSummary, setPlanSummary] = useState<any>(null);

  async function handlePlan() {
    if (!recId) {
      setError("Missing recommendation id");
      return;
    }

    setError(null);
    setPlanning(true);

    try {
      const res = await deployPlan({ recommendation_id: recId });
      setRunId(res.run_id);
      setWarnings(res.policy_warnings ?? []);
      setPlanSummary(res.plan_summary);

      // stay on page for approval
    } catch (e: any) {
      setError(e.message ?? "Plan failed");
    } finally {
      setPlanning(false);
    }
  }

  async function handleApprove() {
    if (!runId) return;

    setError(null);
    setApproving(true);

    try {
      const res = await deployApprove(runId);
      router.push(`/portal/status?run=${res.run_id}`);
    } catch (e: any) {
      setError(e.message ?? "Approve/apply failed");
    } finally {
      setApproving(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold">Deploy Stack</h2>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!runId ? (
        <Button onClick={handlePlan} disabled={planning}>
          {planning ? "Planning..." : "Generate Terraform Plan"}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-slate-300">
            Run: <span className="font-mono">{runId}</span>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-md border border-yellow-800 bg-yellow-950/40 p-3 text-sm text-yellow-200">
              <div className="font-semibold mb-1">Policy Warnings</div>
              <ul className="list-disc pl-5 space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {planSummary && (
            <pre className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs overflow-x-auto">
              {JSON.stringify(planSummary, null, 2)}
            </pre>
          )}

          <Button onClick={handleApprove} disabled={approving}>
            {approving ? "Applying..." : "Approve & Apply"}
          </Button>
        </div>
      )}
    </Card>
  );
}
