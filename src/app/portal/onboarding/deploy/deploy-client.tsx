"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import {
  deployPlan,
  deployApprove,
  deployApply,
  type DeployPlanResponse,
  type DeployPlanRequest,
} from "@/lib/api";

type Props = {
  recommendationId?: string;
};

export default function DeployClient({ recommendationId }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const recId = useMemo(() => {
    return params.get("rec") || recommendationId || "test-001";
  }, [params, recommendationId]);

  const [runId, setRunId] = useState<string | null>(null);
  const [plan, setPlan] = useState<DeployPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlan() {
    setLoading(true);
    setError(null);

    const payload: DeployPlanRequest = {
      recommendation_id: recId,
      name_prefix: "zordrax",
      region: "westeurope",
      environment: "dev",
      enable_apim: false,
      backend_app_hostname: "example.azurewebsites.net",
    };

    try {
      const res = await deployPlan(payload);
      setPlan(res);
      setRunId(res.run_id);

      try {
        localStorage.setItem("zordrax:last_run_id", res.run_id);
      } catch {
        // ignore (privacy mode / blocked storage)
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate terraform plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveApply() {
    if (!runId) {
      setError("No runId yet. Generate a plan first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deployApprove(runId);
      const res = await deployApply(runId);

      setPlan((p) =>
        p
          ? { ...p, status: res.status ?? p.status }
          : ({ run_id: runId, status: res.status ?? "running", plan_summary: {} } as any)
      );

      try {
        localStorage.setItem("zordrax:last_run_id", runId);
      } catch {
        // ignore
      }

      router.push(`/portal/runs/${runId}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to approve/apply infrastructure");
    } finally {
      setLoading(false);
    }
  }

  function handleViewStatus() {
    if (!runId) {
      setError("No runId yet. Generate a plan first.");
      return;
    }
    router.push(`/portal/runs/${runId}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button onClick={handlePlan} disabled={loading}>
          {loading ? "Working..." : "Generate Terraform Plan"}
        </Button>

        <Button onClick={handleApproveApply} disabled={loading || !runId}>
          {loading ? "Working..." : "Approve & Apply"}
        </Button>

        <Button onClick={handleViewStatus} disabled={!runId}>
          View Status
        </Button>
      </div>

      {error && (
        <div className="rounded border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Card className="space-y-3">
        <div className="text-sm text-slate-300">
          <div>
            <span className="font-semibold">Recommendation:</span>{" "}
            <span className="font-mono">{recId}</span>
          </div>
          <div>
            <span className="font-semibold">Run ID:</span>{" "}
            <span className="font-mono">{runId ?? "(none yet)"}</span>
          </div>
        </div>

        <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">
          {JSON.stringify(plan, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
