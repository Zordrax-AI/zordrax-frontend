"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Uses your existing Next proxy: /api/agent/* -> backend
async function agentFetch(path: string, init?: RequestInit) {
  const res = await fetch(`/api/agent${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || data.message)) ||
      `Agent error ${res.status} for ${path}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data;
}

type DeployPlanResponse = {
  run_id: string;
  status?: string;
  plan_summary?: {
    resources_to_add?: number;
    recommendation_id?: string;
    package_id?: string;
    [k: string]: any;
  };
  policy_warnings?: any[];
  [k: string]: any;
};

type RefreshResponse = {
  run_id: string;
  previous_status?: string;
  current_status?: string;
  changed?: boolean;
  pipeline?: {
    pipeline_id?: number;
    pipeline_run_id?: number;
    state?: string;
    result?: string | null;
    url?: string | null;
    [k: string]: any;
  };
  [k: string]: any;
};

export default function RecommendationsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [phase, setPhase] = useState<
    "idle" | "planning" | "plan_ok" | "approving" | "applying" | "polling" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string>("");

  const [plan, setPlan] = useState<DeployPlanResponse | null>(null);
  const [refresh, setRefresh] = useState<RefreshResponse | null>(null);

  const runId = useMemo(() => plan?.run_id || "", [plan]);

  // Avoid multiple polling loops
  const pollTimer = useRef<any>(null);

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function createPlan() {
    if (!requirementSetId) {
      setPhase("error");
      setError("Missing requirement_set_id in URL.");
      return;
    }

    stopPolling();
    setPhase("planning");
    setError("");

    try {
      const res = (await agentFetch(`/api/deploy/plan`, {
        method: "POST",
        body: JSON.stringify({ requirement_set_id: requirementSetId }),
      })) as DeployPlanResponse;

      if (!res?.run_id) {
        throw new Error(`deploy/plan did not return run_id: ${JSON.stringify(res)}`);
      }

      setPlan(res);
      setPhase("plan_ok");
    } catch (e: any) {
      setPhase("error");
      setError(e?.message || String(e));
    }
  }

  async function approveDeploy() {
    if (!runId) return;
    setPhase("approving");
    setError("");

    try {
      await agentFetch(`/api/deploy/${encodeURIComponent(runId)}/approve`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      // After approval, refresh status once
      const r = (await agentFetch(`/api/deploy/${encodeURIComponent(runId)}/refresh`, {
        method: "GET",
      })) as RefreshResponse;
      setRefresh(r);

      setPhase("plan_ok");
    } catch (e: any) {
      setPhase("error");
      setError(e?.message || String(e));
    }
  }

  async function applyInfra() {
    if (!runId) return;
    stopPolling();
    setPhase("applying");
    setError("");

    try {
      await agentFetch(`/api/deploy/${encodeURIComponent(runId)}/apply`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      // Start polling refresh until done
      setPhase("polling");
      startPolling();
    } catch (e: any) {
      setPhase("error");
      setError(e?.message || String(e));
    }
  }

  async function doRefreshOnce() {
    if (!runId) return;

    const r = (await agentFetch(`/api/deploy/${encodeURIComponent(runId)}/refresh`, {
      method: "GET",
    })) as RefreshResponse;

    setRefresh(r);

    const cur = (r?.current_status || "").toLowerCase();
    if (cur === "infra_succeeded" || cur === "infra_failed") {
      stopPolling();
      setPhase("done");
    }
  }

  function startPolling() {
    // poll every 5 seconds
    pollTimer.current = setInterval(() => {
      doRefreshOnce().catch((e) => {
        // polling errors shouldn’t explode the UI; show error and stop
        stopPolling();
        setPhase("error");
        setError(e?.message || String(e));
      });
    }, 5000);

    // kick immediately
    doRefreshOnce().catch((e) => {
      stopPolling();
      setPhase("error");
      setError(e?.message || String(e));
    });
  }

  // Auto-create plan on load (if requirement_set_id present)
  useEffect(() => {
    if (!requirementSetId) return;
    createPlan();
    // cleanup
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementSetId]);

  const currentStatus = refresh?.current_status || plan?.status || "—";
  const packageId = plan?.plan_summary?.package_id || "—";
  const recommendationId = plan?.plan_summary?.recommendation_id || "—";
  const resourcesToAdd = plan?.plan_summary?.resources_to_add ?? "—";

  return (
    <div className="space-y-4 max-w-4xl">
      <Card className="p-4 space-y-3">
        <div className="text-white text-xl font-semibold">Deploy Plan (Recommendations)</div>

        <div className="text-slate-400 text-sm">
          Requirement Set:{" "}
          <span className="font-mono text-slate-200">{requirementSetId || "—"}</span>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-slate-400 text-xs">RUN_ID</div>
            <div className="font-mono text-slate-200 break-all">{runId || "—"}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-slate-400 text-xs">Current status</div>
            <div className="font-mono text-slate-200 break-all">{currentStatus}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-slate-400 text-xs">Package ID</div>
            <div className="font-mono text-slate-200 break-all">{packageId}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-slate-400 text-xs">Recommendation ID (placeholder)</div>
            <div className="font-mono text-slate-200 break-all">{recommendationId}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-slate-400 text-xs">Resources to add</div>
            <div className="font-mono text-slate-200 break-all">{String(resourcesToAdd)}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-slate-400 text-xs">Pipeline</div>
            <div className="font-mono text-slate-200 break-all">
              {refresh?.pipeline?.state || "—"} / {refresh?.pipeline?.result ?? "—"}
            </div>
          </div>
        </div>

        {plan?.policy_warnings?.length ? (
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-100">
            <div className="font-semibold mb-1">Policy warnings</div>
            <pre className="text-xs overflow-auto">{JSON.stringify(plan.policy_warnings, null, 2)}</pre>
          </div>
        ) : null}

        {plan ? (
          <details className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <summary className="cursor-pointer text-slate-200 text-sm">Raw plan JSON</summary>
            <pre className="mt-2 text-xs text-slate-300 overflow-auto">{JSON.stringify(plan, null, 2)}</pre>
          </details>
        ) : null}

        {refresh ? (
          <details className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <summary className="cursor-pointer text-slate-200 text-sm">Latest refresh JSON</summary>
            <pre className="mt-2 text-xs text-slate-300 overflow-auto">{JSON.stringify(refresh, null, 2)}</pre>
          </details>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            onClick={createPlan}
            disabled={phase === "planning" || phase === "approving" || phase === "applying" || phase === "polling"}
          >
            {phase === "planning" ? "Planning..." : "Rebuild Plan"}
          </Button>

          <Button
            onClick={approveDeploy}
            disabled={!runId || phase === "approving" || phase === "applying" || phase === "polling"}
          >
            {phase === "approving" ? "Approving..." : "Approve Deploy"}
          </Button>

          <Button
            onClick={applyInfra}
            disabled={!runId || phase === "applying" || phase === "polling"}
          >
            {phase === "applying" ? "Applying..." : phase === "polling" ? "Applying (Polling...)" : "Apply Infra"}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (!runId) return;
              router.push(`/portal/onboarding/mozart/connect-data?requirement_set_id=${encodeURIComponent(requirementSetId)}`);
            }}
          >
            Back
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          Note: Your backend currently has <span className="font-mono">/api/deploy/plan</span>,{" "}
          <span className="font-mono">/api/deploy/&lt;run_id&gt;/approve</span>,{" "}
          <span className="font-mono">/api/deploy/&lt;run_id&gt;/apply</span>,{" "}
          <span className="font-mono">/api/deploy/&lt;run_id&gt;/refresh</span> — no “recommend” endpoints yet.
        </div>
      </Card>
    </div>
  );
}
