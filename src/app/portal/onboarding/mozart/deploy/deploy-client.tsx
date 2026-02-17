"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  deployPlan,
  deployApprove,
  refreshRun,
  submitRequirementSet,
  approveRequirementSet,
} from "@/lib/api";
import { getRequirementSetId } from "@/lib/wizard";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetries<T>(fn: () => Promise<T>, tries = 3) {
  let lastErr: any;
  const delays = [750, 1500, 3000];
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await sleep(delays[i] ?? 3000);
    }
  }
  throw lastErr;
}

export default function DeployTimelineClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const requirementSetId = getRequirementSetId(sp) ?? "";

  const [runId, setRunId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [last, setLast] = useState<any>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const canPlan = useMemo(() => !!requirementSetId && !busy, [requirementSetId, busy]);
  const canApprove = useMemo(() => !!runId && !busy, [runId, busy]);

  async function doPlan() {
    if (!requirementSetId) return;
    setBusy(true);
    setError("");
    setNeedsApproval(false);
    try {
      const p = await deployPlan({
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
      if ((p as any).run_id) {
        const qs = new URLSearchParams({
          run_id: (p as any).run_id,
          requirement_set_id: requirementSetId,
        });
        router.push(`/portal/onboarding/mozart/run?${qs.toString()}`);
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      const lower = msg.toLowerCase();
      if (msg.includes("409") || lower.includes("requirement_set_not_approved")) {
        try {
          await submitRequirementSet(requirementSetId);
          await approveRequirementSet(requirementSetId);
          setNeedsApproval(false);

          const p = await deployPlan({
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
          setError("");
        } catch (inner: any) {
          setNeedsApproval(true);
          setError(inner?.message || msg);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function doSubmitApprove() {
    if (!requirementSetId) return;
    setBusy(true);
    setError("");
    try {
      await submitRequirementSet(requirementSetId);
      await approveRequirementSet(requirementSetId);
      setNeedsApproval(false);
      setBusy(false);
      await doPlan();
    } catch (e: any) {
      setError(e?.message || String(e));
      setBusy(false);
    }
  }

  async function doApprove() {
    if (!runId) return;
    setBusy(true);
    setError("");
    try {
      const r = await deployApprove(runId);
      setLast(r);
      setStatus((r as any).status || status || "pipeline_started");
      startPolling();
      const qs = new URLSearchParams({
        run_id: runId,
        requirement_set_id: requirementSetId,
      });
      router.push(`/portal/onboarding/mozart/run?${qs.toString()}`);
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
      const r = await withRetries(() => refreshRun(runId), 3);
      setLast(r);
      setStatus((r as any).current_status || (r as any).status || status);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    if (!runId) return;
    stopPolling();
    pollRef.current = setInterval(() => {
      refreshRun(runId)
        .then((r) => {
          setLast(r);
          setStatus((r as any).current_status || (r as any).status || status);
        })
        .catch(() => {
          stopPolling();
        });
    }, 5000);
  }

  useEffect(() => stopPolling, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Deploy + Timeline</h1>
        <p className="mt-1 text-sm text-slate-600">
          Plan-only by default. Approve triggers the infra pipeline. Refresh polls callback state.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <Card className="p-4 space-y-3 bg-white border border-slate-200">
        <div className="text-sm text-slate-800">
          Requirement Set: <span className="text-slate-600">{requirementSetId || "--"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={doPlan} disabled={!canPlan}>
            {busy ? "Working..." : "Create Plan"}
          </Button>
          {needsApproval ? (
            <Button variant="outline" onClick={doSubmitApprove} disabled={busy}>
              Submit + Approve requirement set
            </Button>
          ) : null}
          <Button variant="outline" onClick={doApprove} disabled={!canApprove}>
            Approve (Trigger Infra)
          </Button>
          <Button variant="outline" onClick={doRefresh} disabled={!canApprove}>
            Refresh
          </Button>
        </div>

        <div className="text-xs text-slate-600">
          run_id: <span className="text-slate-800">{runId || "--"}</span> · status:{" "}
          <span className="text-slate-800">{status || "--"}</span>
        </div>

        <pre className="text-xs text-slate-800 overflow-auto rounded bg-slate-100 border border-slate-200 p-3">
          {JSON.stringify(last, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
