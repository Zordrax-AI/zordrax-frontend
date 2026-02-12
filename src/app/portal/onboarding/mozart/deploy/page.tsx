"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deploy } from "@/lib/agent-proxy";

export default function DeployTimelinePage() {
  const sp = useSearchParams();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [runId, setRunId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [last, setLast] = useState<any>(null);

  const canPlan = useMemo(() => !!requirementSetId && !busy, [requirementSetId, busy]);
  const canApprove = useMemo(() => !!runId && !busy, [runId, busy]);

  async function doPlan() {
    if (!requirementSetId) return;
    setBusy(true);
    setError("");
    try {
      const p = await deploy.createPlan({
        requirement_set_id: requirementSetId,
        name_prefix: "zordrax",
        region: "westeurope",
        environment: "dev",
        enable_apim: false,
        backend_app_hostname: "example.azurewebsites.net",
      });
      setRunId((p as any).run_id || "");
      setStatus((p as any).status || "awaiting_approval");
      setLast(p);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doApprove() {
    if (!runId) return;
    setBusy(true);
    setError("");
    try {
      const r = await deploy.approveRun(runId);
      setLast(r);
      setStatus((r as any).status || status || "running");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRefresh() {
    if (!runId) return;
    setBusy(true);
    setError("");
    try {
      const r = await deploy.refresh(runId);
      setLast(r);
      setStatus((r as any).current_status || (r as any).status || status);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deploy + Timeline</h1>
        <p className="mt-1 text-sm text-slate-400">
          Plan-only by default. Approve triggers the infra pipeline. Refresh polls the callback state.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      <Card className="p-4 space-y-3">
        <div className="text-sm text-slate-200">
          Requirement Set: <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={doPlan} disabled={!canPlan}>
            {busy ? "Working…" : "Create Plan"}
          </Button>
          <Button variant="outline" onClick={doApprove} disabled={!canApprove}>
            Approve (Trigger Infra)
          </Button>
          <Button variant="outline" onClick={doRefresh} disabled={!canApprove}>
            Refresh
          </Button>
        </div>

        <div className="text-xs text-slate-400">
          run_id: <span className="text-slate-200">{runId || "—"}</span> · status: <span className="text-slate-200">{status || "—"}</span>
        </div>

        <pre className="text-xs text-slate-300 overflow-auto rounded bg-slate-950 p-3">{JSON.stringify(last, null, 2)}</pre>
      </Card>
    </div>
  );
}
