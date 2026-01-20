"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deployPlan,
  deployApply,
  deployApprove,
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
  const [plan, setPlan] = useState<DeployPlanResponse | null>(null);

  // ✅ keep as number (UI-friendly)
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional: load last runId from session/local storage if you want
  useEffect(() => {
    // no-op
  }, []);

  async function handlePlan() {
    setError(null);
    setLoading(true);

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
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate terraform plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveApply() {
    if (!runId) {
      setError("No run_id yet. Generate plan first.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // approve (optional depending on your backend)
      await deployApprove(runId);

      // apply
      const res: DeployApplyResponse = await deployApply(runId);

      // ✅ FIX: pipeline_run_id can be string OR number -> coerce to number
      if (res?.pipeline_run_id !== undefined && res.pipeline_run_id !== null) {
        const n =
          typeof res.pipeline_run_id === "number"
            ? res.pipeline_run_id
            : Number(res.pipeline_run_id);

        setPipelineRunId(Number.isFinite(n) ? n : null);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to approve/apply infrastructure");
    } finally {
      setLoading(false);
    }
  }

  function handleViewStatus() {
    if (!runId) {
      setError("No run_id yet. Generate plan first.");
      return;
    }
    router.push(`/portal/status?run=${runId}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handlePlan}
          disabled={loading}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
        >
          Generate Terraform Plan
        </button>

        <button
          onClick={handleApproveApply}
          disabled={loading || !runId}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
        >
          Approve &amp; Apply
        </button>

        <button
          onClick={handleViewStatus}
          disabled={!runId}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
        >
          View Status
        </button>
      </div>

      {pipelineRunId !== null && (
        <div className="rounded-md border border-emerald-700 bg-emerald-900/20 p-3 text-sm text-emerald-200">
          Pipeline triggered. Run ID: <span className="font-mono">{pipelineRunId}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {plan && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm">
          <div className="mb-2 text-slate-200">
            Run ID: <span className="font-mono">{plan.run_id}</span>
          </div>
          <pre className="overflow-auto text-xs text-slate-300">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
