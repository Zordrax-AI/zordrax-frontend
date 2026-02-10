"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import {
  brdApprove,
  brdCreateRequirementSet,
  brdCreateSession,
  brdReadRequirementSet,
  brdSubmit,
  brdUpsertBusinessContext,
  brdUpsertConstraints,
  brdUpsertGuardrails,
  deployPlanFromRequirementSet,
  type BusinessContextIn,
  type ConstraintsIn,
  type GuardrailsIn,
} from "@/lib/brd";

import { deployApply, deployApprove, deployRefresh, type DeployRefreshResponse } from "@/lib/api";

type StepKey =
  | "intake"
  | "context"
  | "constraints"
  | "guardrails"
  | "review"
  | "submit"
  | "approve"
  | "plan"
  | "infra"
  | "package";

type Step = {
  key: StepKey;
  label: string;
  description: string;
};

const STEPS: Step[] = [
  { key: "intake", label: "Intake", description: "Create session + requirement set" },
  { key: "context", label: "Business Context", description: "Why, who, what" },
  { key: "constraints", label: "Constraints", description: "Where, env, cloud" },
  { key: "guardrails", label: "Guardrails", description: "Security / compliance" },
  { key: "review", label: "Review", description: "Check completeness" },
  { key: "submit", label: "Submit", description: "Lock draft + submit" },
  { key: "approve", label: "Approve", description: "Approve requirement set" },
  { key: "plan", label: "Plan", description: "Create deploy plan (RUN_ID)" },
  { key: "infra", label: "Infra", description: "Approve + trigger pipeline" },
  { key: "package", label: "Package", description: "Summary" },
];

type TimelineEvent = {
  at: string;
  title: string;
  detail?: string;
  level?: "info" | "warning" | "error";
};

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse<T>(txt: string | null, fallback: T): T {
  if (!txt) return fallback;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

function chipClass(status?: string) {
  const s = (status || "").toLowerCase();
  if (!s) return "bg-slate-800 text-slate-200 border-slate-700";
  if (s.includes("fail") || s.includes("reject"))
    return "bg-red-950/40 text-red-200 border-red-900/40";
  if (s.includes("succeed") || s.includes("approved") || s.includes("completed"))
    return "bg-emerald-950/40 text-emerald-200 border-emerald-900/40";
  if (s.includes("running") || s.includes("started") || s.includes("await"))
    return "bg-blue-950/40 text-blue-200 border-blue-900/40";
  return "bg-slate-800 text-slate-200 border-slate-700";
}

function Chip({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${chipClass(label)}`}>
      {label || "—"}
    </span>
  );
}

function Panel({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
        </div>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export default function MozartClient() {
  const router = useRouter();
  const params = useSearchParams();

  const qsReqSetId = params.get("requirement_set_id") || "";
  const qsRunId = params.get("run_id") || "";
  const qsStep = (params.get("step") as StepKey | null) || null;

  const storageKey = useMemo(() => {
    const rid = qsReqSetId || "draft";
    return `zordrax:mozart:${rid}`;
  }, [qsReqSetId]);

  const [sessionId, setSessionId] = useState<string>("");
  const [requirementSetId, setRequirementSetId] = useState<string>(qsReqSetId);
  const [runId, setRunId] = useState<string>(qsRunId);

  const [reqSetStatus, setReqSetStatus] = useState<string>("");
  const [reqSetVersion, setReqSetVersion] = useState<number | null>(null);

  const [deployStatus, setDeployStatus] = useState<string>("");
  const [refresh, setRefresh] = useState<DeployRefreshResponse | null>(null);

  const [step, setStep] = useState<StepKey>(qsStep ?? "intake");

  const [title, setTitle] = useState<string>("Mozart Run");
  const [createdBy, setCreatedBy] = useState<string>("portal");

  const [businessContext, setBusinessContext] = useState<BusinessContextIn>({
    industry: "",
    business_owner: "",
    description: "",
    stakeholders: [],
  });

  const [constraints, setConstraints] = useState<ConstraintsIn>({
    cloud: "azure",
    region: "westeurope",
    environment: "dev",
  });

  const [guardrails, setGuardrails] = useState<GuardrailsIn>({
    pii_present: true,
    gdpr_required: true,
    private_networking_required: true,
    budget_eur_month: 3000,
  });

  const [namePrefix, setNamePrefix] = useState<string>("zordrax");
  const [enableApim, setEnableApim] = useState<boolean>(false);
  const [backendAppHostname, setBackendAppHostname] = useState<string>("example.azurewebsites.net");

  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const pollTimer = useRef<number | null>(null);

  function pushEvent(ev: Omit<TimelineEvent, "at">) {
    setTimeline((prev) => [{ at: nowIso(), ...ev }, ...prev]);
  }

  // Persist local draft
  useEffect(() => {
    const payload = {
      sessionId,
      requirementSetId,
      runId,
      title,
      createdBy,
      businessContext,
      constraints,
      guardrails,
      namePrefix,
      enableApim,
      backendAppHostname,
      step,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    sessionId,
    requirementSetId,
    runId,
    title,
    createdBy,
    businessContext,
    constraints,
    guardrails,
    namePrefix,
    enableApim,
    backendAppHostname,
    step,
    storageKey,
  ]);

  // Restore local draft
  useEffect(() => {
    try {
      const saved = safeJsonParse<any>(localStorage.getItem(storageKey), null);
      if (!saved) return;

      if (!qsReqSetId && saved.requirementSetId) setRequirementSetId(saved.requirementSetId);
      if (!qsRunId && saved.runId) setRunId(saved.runId);
      if (saved.sessionId) setSessionId(saved.sessionId);
      if (saved.title) setTitle(saved.title);
      if (saved.createdBy) setCreatedBy(saved.createdBy);
      if (saved.businessContext) setBusinessContext(saved.businessContext);
      if (saved.constraints) setConstraints(saved.constraints);
      if (saved.guardrails) setGuardrails(saved.guardrails);
      if (saved.namePrefix) setNamePrefix(saved.namePrefix);
      if (typeof saved.enableApim === "boolean") setEnableApim(saved.enableApim);
      if (saved.backendAppHostname) setBackendAppHostname(saved.backendAppHostname);
      if (!qsStep && saved.step) setStep(saved.step);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Keep URL in sync
  useEffect(() => {
    const q = new URLSearchParams();
    if (requirementSetId) q.set("requirement_set_id", requirementSetId);
    if (runId) q.set("run_id", runId);
    if (step) q.set("step", step);
    router.replace(`/portal/onboarding/mozart?${q.toString()}`);
  }, [requirementSetId, runId, step, router]);

  // Load requirement set status
  useEffect(() => {
    if (!requirementSetId) return;
    let cancelled = false;

    (async () => {
      try {
        const rs = await brdReadRequirementSet(requirementSetId);
        if (cancelled) return;
        setReqSetStatus(rs.status);
        setReqSetVersion(rs.version);

        if (rs.business_context) setBusinessContext((p) => ({ ...p, ...(rs.business_context || {}) }));
        if (rs.constraints) setConstraints((p) => ({ ...p, ...(rs.constraints || {}) }));
        if (rs.guardrails) setGuardrails((p) => ({ ...p, ...(rs.guardrails || {}) }));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requirementSetId]);

  // Poll refresh when we have a run
  useEffect(() => {
    if (!runId) return;

    async function tick() {
      try {
        const r = await deployRefresh(runId);
        setRefresh(r);
        setDeployStatus(r.current_status);

        if (r.changed) {
          pushEvent({
            title: `Run status: ${r.previous_status} → ${r.current_status}`,
            detail: r.pipeline?.url ? `Pipeline: ${r.pipeline.url}` : undefined,
          });
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    }

    tick();
    pollTimer.current = window.setInterval(tick, 4000);

    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // Gates
  const contextComplete = Boolean((businessContext.industry || "").trim() && (businessContext.description || "").trim());

  const constraintsComplete = Boolean(
    (constraints.cloud || "").trim() && (constraints.region || "").trim() && (constraints.environment || "").trim()
  );

  const guardrailsComplete =
    guardrails.pii_present !== null &&
    guardrails.gdpr_required !== null &&
    guardrails.private_networking_required !== null &&
    typeof guardrails.budget_eur_month === "number";

  const canSubmit = contextComplete && constraintsComplete && guardrailsComplete && reqSetStatus === "draft";
  const canApproveReqSet = reqSetStatus === "submitted";
  const canPlan = reqSetStatus === "approved";

  const canApproveDeploy =
    Boolean(runId) && (deployStatus === "awaiting_approval" || deployStatus === "planned");

  const canTriggerInfra =
    Boolean(runId) &&
    (deployStatus === "approved" || deployStatus === "planned" || deployStatus === "awaiting_approval");

  const infraDone = (deployStatus || "").includes("infra_succeeded") || (deployStatus || "").includes("infra_failed");

  function stepIndex(k: StepKey) {
    return STEPS.findIndex((s) => s.key === k);
  }

  const maxUnlockedIndex = useMemo(() => {
    let idx = 0;
    if (requirementSetId) idx = Math.max(idx, stepIndex("context"));
    if (contextComplete) idx = Math.max(idx, stepIndex("constraints"));
    if (constraintsComplete) idx = Math.max(idx, stepIndex("guardrails"));
    if (guardrailsComplete) idx = Math.max(idx, stepIndex("review"));
    if (reqSetStatus === "submitted") idx = Math.max(idx, stepIndex("approve"));
    if (reqSetStatus === "approved") idx = Math.max(idx, stepIndex("plan"));
    if (runId) idx = Math.max(idx, stepIndex("infra"));
    if (infraDone) idx = Math.max(idx, stepIndex("package"));
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementSetId, contextComplete, constraintsComplete, guardrailsComplete, reqSetStatus, runId, infraDone]);

  // Actions
  async function handleCreateIntake() {
    setError(null);
    setBusy(true);
    try {
      const s = await brdCreateSession({ created_by: createdBy || "portal" });
      setSessionId(s.session_id);
      pushEvent({ title: "BRD session created", detail: s.session_id });

      const rs = await brdCreateRequirementSet({
        session_id: s.session_id,
        title,
        created_by: createdBy || "portal",
      });
      setRequirementSetId(rs.id);
      setReqSetStatus(rs.status);
      setReqSetVersion(rs.version);
      pushEvent({ title: "Requirement set created", detail: rs.id });
      setStep("context");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Intake failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function saveBusinessContext() {
    if (!requirementSetId) return;
    setError(null);
    setBusy(true);
    try {
      await brdUpsertBusinessContext(requirementSetId, businessContext);
      pushEvent({ title: "Business context saved" });
      setStep("constraints");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Save business context failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function saveConstraints() {
    if (!requirementSetId) return;
    setError(null);
    setBusy(true);
    try {
      await brdUpsertConstraints(requirementSetId, constraints);
      pushEvent({ title: "Constraints saved" });
      setStep("guardrails");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Save constraints failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function saveGuardrails() {
    if (!requirementSetId) return;
    setError(null);
    setBusy(true);
    try {
      await brdUpsertGuardrails(requirementSetId, guardrails);
      pushEvent({ title: "Guardrails saved" });
      setStep("review");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Save guardrails failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!requirementSetId) return;
    setError(null);
    setBusy(true);
    try {
      await brdSubmit(requirementSetId, createdBy || "portal");
      pushEvent({ title: "Requirement set submitted" });
      const rs = await brdReadRequirementSet(requirementSetId);
      setReqSetStatus(rs.status);
      setReqSetVersion(rs.version);
      setStep("approve");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Submit failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveReqSet() {
    if (!requirementSetId) return;
    setError(null);
    setBusy(true);
    try {
      await brdApprove(requirementSetId, createdBy || "portal");
      pushEvent({ title: "Requirement set approved" });
      const rs = await brdReadRequirementSet(requirementSetId);
      setReqSetStatus(rs.status);
      setReqSetVersion(rs.version);
      setStep("plan");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Approve failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePlan() {
    if (!requirementSetId) return;
    setError(null);
    setBusy(true);
    try {
      const region = constraints.region || "westeurope";
      const environment = constraints.environment || "dev";

      const resp = await deployPlanFromRequirementSet({
        requirement_set_id: requirementSetId,
        name_prefix: namePrefix || "zordrax",
        region,
        environment,
        enable_apim: enableApim,
        backend_app_hostname: backendAppHostname,
      });

      setRunId(resp.run_id);
      setDeployStatus(resp.status);
      pushEvent({ title: "Deploy plan created", detail: `run_id=${resp.run_id}` });
      setStep("infra");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Create plan failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveDeploy() {
    if (!runId) return;
    setError(null);
    setBusy(true);
    try {
      await deployApprove(runId);
      pushEvent({ title: "Deploy approved" });
      const r = await deployRefresh(runId);
      setRefresh(r);
      setDeployStatus(r.current_status);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Deploy approve failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleTriggerInfra() {
    if (!runId) return;
    setError(null);
    setBusy(true);
    try {
      await deployApply(runId);
      pushEvent({ title: "Infra pipeline triggered" });
      const r = await deployRefresh(runId);
      setRefresh(r);
      setDeployStatus(r.current_status);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      pushEvent({ title: "Infra trigger failed", detail: msg, level: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mozart Onboarding</h1>
          <p className="text-slate-400">BRD → Submit → Approve → Plan → Infra → Package</p>
        </div>

        <div className="flex items-center gap-2">
          {busy ? <span className="text-sm text-slate-300">Working…</span> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip label={requirementSetId ? `reqset:${requirementSetId.slice(0, 8)}…` : "reqset:—"} />
        <Chip label={runId ? `run:${runId.slice(0, 8)}…` : "run:—"} />
        <Chip label={`BRD:${reqSetStatus || "—"}`} />
        <Chip label={`Deploy:${deployStatus || "—"}`} />
        {typeof reqSetVersion === "number" ? <Chip label={`v${reqSetVersion}`} /> : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Stepper */}
        <div className="lg:col-span-3">
          <Panel title="Steps">
            <div className="space-y-1">
              {STEPS.map((s, idx) => {
                const active = s.key === step;
                const locked = idx > maxUnlockedIndex;

                return (
                  <button
                    key={s.key}
                    className={[
                      "w-full rounded-md px-3 py-2 text-left text-sm transition border",
                      active ? "bg-slate-900 text-white border-slate-700" : "text-slate-300 hover:bg-slate-900 border-slate-800",
                      locked ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                    disabled={locked}
                    onClick={() => setStep(s.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs">{locked ? "🔒" : "→"}</div>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">{s.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
              IDs are kept in the URL so refresh/resume works.
            </div>
          </Panel>
        </div>

        {/* Working panel */}
        <div className="lg:col-span-6">
          <Panel title={STEPS.find((s) => s.key === step)?.label || "Wizard"}>
            {/* Intake */}
            {step === "intake" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">Run title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ACME – Dev" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Created by</label>
                    <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="portal" />
                  </div>
                </div>

                <Button onClick={handleCreateIntake} disabled={busy}>
                  Create session + requirement set
                </Button>
              </div>
            ) : null}

            {/* Context */}
            {step === "context" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Industry</label>
                  <Input
                    value={businessContext.industry ?? ""}
                    onChange={(e) => setBusinessContext((p) => ({ ...p, industry: e.target.value }))}
                    placeholder="Healthcare, Retail, Public Sector…"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Business owner</label>
                  <Input
                    value={businessContext.business_owner ?? ""}
                    onChange={(e) => setBusinessContext((p) => ({ ...p, business_owner: e.target.value }))}
                    placeholder="Name / Role"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Description</label>
                  <Textarea
                    value={businessContext.description ?? ""}
                    onChange={(e) => setBusinessContext((p) => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. Daily ingestion from Azure SQL → curated star schema → Power BI dashboards"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Stakeholders (comma separated)</label>
                  <Input
                    value={(businessContext.stakeholders || []).join(", ")}
                    onChange={(e) =>
                      setBusinessContext((p) => ({
                        ...p,
                        stakeholders: e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="CIO, Data Team Lead, Security…"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={saveBusinessContext} disabled={busy || !requirementSetId}>
                    Save & Next
                  </Button>
                  <span className="text-xs text-slate-400">
                    {contextComplete ? "✓ Complete" : "Industry + Description required"}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Constraints */}
            {step === "constraints" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs text-slate-400">Cloud</label>
                    <Input
                      value={constraints.cloud ?? ""}
                      onChange={(e) => setConstraints((p) => ({ ...p, cloud: e.target.value }))}
                      placeholder="azure"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Region</label>
                    <Input
                      value={constraints.region ?? ""}
                      onChange={(e) => setConstraints((p) => ({ ...p, region: e.target.value }))}
                      placeholder="westeurope"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Environment</label>
                    <Input
                      value={constraints.environment ?? ""}
                      onChange={(e) => setConstraints((p) => ({ ...p, environment: e.target.value }))}
                      placeholder="dev"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={saveConstraints} disabled={busy || !requirementSetId}>
                    Save & Next
                  </Button>
                  <span className="text-xs text-slate-400">
                    {constraintsComplete ? "✓ Complete" : "Cloud + Region + Environment required"}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Guardrails */}
            {step === "guardrails" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">PII present (true/false)</label>
                    <Input
                      value={String(guardrails.pii_present ?? "")}
                      onChange={(e) => setGuardrails((p) => ({ ...p, pii_present: e.target.value === "true" }))}
                      placeholder="true"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">GDPR required (true/false)</label>
                    <Input
                      value={String(guardrails.gdpr_required ?? "")}
                      onChange={(e) => setGuardrails((p) => ({ ...p, gdpr_required: e.target.value === "true" }))}
                      placeholder="true"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Private networking required (true/false)</label>
                    <Input
                      value={String(guardrails.private_networking_required ?? "")}
                      onChange={(e) =>
                        setGuardrails((p) => ({ ...p, private_networking_required: e.target.value === "true" }))
                      }
                      placeholder="true"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Budget EUR/month</label>
                    <Input
                      value={String(guardrails.budget_eur_month ?? "")}
                      onChange={(e) => setGuardrails((p) => ({ ...p, budget_eur_month: Number(e.target.value || 0) }))}
                      placeholder="3000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={saveGuardrails} disabled={busy || !requirementSetId}>
                    Save & Next
                  </Button>
                  <span className="text-xs text-slate-400">
                    {guardrailsComplete ? "✓ Complete" : "All fields required"}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Review */}
            {step === "review" ? (
              <div className="space-y-3">
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-sm">
                  <div className="font-semibold">Business Context</div>
                  <div className="mt-1 text-slate-300">{businessContext.description || "—"}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Industry: {businessContext.industry || "—"} · Owner: {businessContext.business_owner || "—"}
                  </div>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-sm">
                  <div className="font-semibold">Constraints</div>
                  <div className="mt-1 text-slate-300">
                    {constraints.cloud || "—"} / {constraints.region || "—"} / {constraints.environment || "—"}
                  </div>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-sm">
                  <div className="font-semibold">Guardrails</div>
                  <div className="mt-1 text-slate-300">
                    PII: {String(guardrails.pii_present)} · GDPR: {String(guardrails.gdpr_required)} · Private:{" "}
                    {String(guardrails.private_networking_required)} · Budget: €{guardrails.budget_eur_month}
                  </div>
                </div>

                <Button onClick={() => setStep("submit")} disabled={busy || !requirementSetId}>
                  Continue
                </Button>
              </div>
            ) : null}

            {/* Submit */}
            {step === "submit" ? (
              <div className="space-y-3">
                <p className="text-slate-300">Submitting locks the draft and moves the requirement set into governance.</p>
                <Button onClick={handleSubmit} disabled={busy || !canSubmit}>
                  Submit requirement set
                </Button>
                <div className="text-xs text-slate-400">
                  Gate: needs complete Context/Constraints/Guardrails and BRD status=draft.
                </div>
              </div>
            ) : null}

            {/* Approve */}
            {step === "approve" ? (
              <div className="space-y-3">
                <p className="text-slate-300">Approving freezes the BRD spec and allows deployment planning.</p>
                <Button onClick={handleApproveReqSet} disabled={busy || !canApproveReqSet}>
                  Approve requirement set
                </Button>
                <div className="text-xs text-slate-400">Gate: BRD status must be submitted.</div>
              </div>
            ) : null}

            {/* Plan */}
            {step === "plan" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">Name prefix</label>
                    <Input value={namePrefix} onChange={(e) => setNamePrefix(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Backend hostname</label>
                    <Input value={backendAppHostname} onChange={(e) => setBackendAppHostname(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">Enable APIM (true/false)</label>
                    <Input value={String(enableApim)} onChange={(e) => setEnableApim(e.target.value === "true")} />
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="text-xs text-slate-400">Region / Env (from constraints)</div>
                    <div className="mt-2">
                      {constraints.region} / {constraints.environment}
                    </div>
                  </div>
                </div>

                <Button onClick={handleCreatePlan} disabled={busy || !canPlan}>
                  Create deploy plan (RUN_ID)
                </Button>
                <div className="text-xs text-slate-400">Gate: BRD status must be approved.</div>
              </div>
            ) : null}

            {/* Infra */}
            {step === "infra" ? (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Infra is safe-by-default. Approve the deploy run, then trigger the pipeline (apply).
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleApproveDeploy} disabled={busy || !canApproveDeploy}>
                    Approve deploy
                  </Button>
                  <Button onClick={handleTriggerInfra} disabled={busy || !canTriggerInfra}>
                    Trigger infra pipeline
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || !runId}
                    onClick={async () => {
                      if (!runId) return;
                      const r = await deployRefresh(runId);
                      setRefresh(r);
                      setDeployStatus(r.current_status);
                    }}
                  >
                    Refresh now
                  </Button>
                </div>

                {refresh ? (
                  <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                    <div>previous_status: {refresh.previous_status}</div>
                    <div>current_status: {refresh.current_status}</div>
                    <div>pipeline.state: {refresh.pipeline?.state}</div>
                    {refresh.pipeline?.url ? <div className="break-all">pipeline.url: {refresh.pipeline.url}</div> : null}
                  </div>
                ) : null}

                {infraDone ? (
                  <Button onClick={() => setStep("package")} disabled={busy}>
                    View package summary
                  </Button>
                ) : (
                  <div className="text-xs text-slate-400">Polling /refresh every ~4 seconds while run_id exists.</div>
                )}
              </div>
            ) : null}

            {/* Package */}
            {step === "package" ? (
              <div className="space-y-4">
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-sm text-slate-400">Package</div>
                  <div className="mt-2 text-lg font-semibold">Provisioning summary</div>

                  <div className="mt-3 space-y-1 text-sm text-slate-300">
                    <div>
                      Requirement Set: <span className="font-mono">{requirementSetId || "—"}</span>
                    </div>
                    <div>
                      Run ID: <span className="font-mono">{runId || "—"}</span>
                    </div>
                    <div>BRD status: {reqSetStatus || "—"}</div>
                    <div>Deploy status: {deployStatus || "—"}</div>
                    <div>
                      Target: {constraints.cloud} / {constraints.region} / {constraints.environment}
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={() => router.push("/portal/runs")}>
                  Go to Runs
                </Button>
              </div>
            ) : null}
          </Panel>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3">
          <Panel title="Timeline" right={<Chip label={busy ? "busy" : "idle"} />}>
            {timeline.length === 0 ? (
              <div className="text-sm text-slate-400">No events yet. Start with Intake.</div>
            ) : (
              <div className="space-y-3">
                {timeline.slice(0, 30).map((e, i) => (
                  <div key={i} className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-200">{e.title}</div>
                      <div className="text-[11px] text-slate-500">{new Date(e.at).toLocaleTimeString()}</div>
                    </div>
                    {e.detail ? <div className="mt-1 text-xs text-slate-300 break-words">{e.detail}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
