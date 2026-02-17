"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { StatusPill } from "@/components/StatusPill";
import { deployPlan, getRequirementSet } from "@/lib/api";
import { ProfilingSummary, RequirementSet } from "@/lib/types";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run" },
];

export default function ApprovalPage() {
  const router = useRouter();
  const [reqId, setReqId] = useState<string | null>(null);
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [req, setReq] = useState<RequirementSet | null>(null);
  const [summary, setSummary] = useState<ProfilingSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = localStorage.getItem("za_requirement_set_id");
    const c = localStorage.getItem("za_connector_id");
    if (!r) {
      router.replace("/onboarding/brd");
      return;
    }
    setReqId(r);
    setConnectorId(c);
    const cachedSummary = localStorage.getItem("za_last_profiling_summary");
    if (cachedSummary) setSummary(JSON.parse(cachedSummary));
    getRequirementSet(r).then(setReq).catch(() => null);
  }, [router]);

  const approvePlan = async () => {
    if (!reqId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await deployPlan({
        requirement_set_id: reqId,
        connector_id: connectorId || undefined,
        recommendation_id: undefined,
        name_prefix: "zordrax",
        region: "westeurope",
        environment: "dev",
        enable_apim: false,
        backend_app_hostname: "example.azurewebsites.net",
      });
      localStorage.setItem("za_run_id", res.run_id);
      setMessage("Plan created");
      router.push(`/onboarding/run/${encodeURIComponent(res.run_id)}`);
    } catch (err: any) {
      setMessage(err.message || "Plan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <Stepper steps={STEPS} current="approval" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Approval</h1>
        <p className="text-sm text-[color:var(--muted)]">Review profiling summary and generate a deploy plan.</p>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="font-semibold">Requirement Set</div>
          {req && <StatusPill status={req.status} />}
          {reqId && <div className="text-xs text-[color:var(--muted)]">{reqId}</div>}
        </div>
        {summary ? (
          <div className="text-sm text-[color:var(--muted)]">
            Tables: {summary.totals.tables} - Size:{" "}
            {summary.totals.size_bytes_estimate ? Math.round(summary.totals.size_bytes_estimate / 1024 / 1024) + " MB" : "n/a"} -{" "}
            Ingestion: {summary.ingestion_recommendation || "n/a"}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">No profiling summary cached.</div>
        )}
        <button
          onClick={approvePlan}
          className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          disabled={loading || !reqId}
        >
          {loading ? "Generating..." : "Approve & Generate Plan"}
        </button>
        {message && <div className="text-sm text-[color:var(--muted)]">{message}</div>}
      </div>
    </div>
  );
}
