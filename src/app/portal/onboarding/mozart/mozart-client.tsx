"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { brd, deploy } from "@/lib/agent-proxy";

type Step =
  | "intake"
  | "business_context"
  | "constraints"
  | "guardrails"
  | "review"
  | "submit"
  | "approve"
  | "plan"
  | "infra"
  | "package";

type TimelineItem = { at: string; title: string; detail?: string };

function now() {
  return new Date().toLocaleTimeString();
}

const steps: { id: Step; label: string; sub: string }[] = [
  { id: "intake", label: "Intake", sub: "Create session + requirement set" },
  { id: "business_context", label: "Business Context", sub: "Why, who, what" },
  { id: "constraints", label: "Constraints", sub: "Where, env, cloud" },
  { id: "guardrails", label: "Guardrails", sub: "Security / compliance" },
  { id: "review", label: "Review", sub: "Check completeness" },
  { id: "submit", label: "Submit", sub: "Lock draft + submit" },
  { id: "approve", label: "Approve", sub: "Approve requirement set" },
  { id: "plan", label: "Plan", sub: "Create deploy plan (RUN_ID)" },
  { id: "infra", label: "Infra", sub: "Approve + run infra pipeline" },
  { id: "package", label: "Package", sub: "Summary" },
];

function splitCsvToList(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function MozartClient() {
  const sp = useSearchParams();
  const initialStep = (sp.get("step") as Step) || "intake";

  const [step, setStep] = useState<Step>(initialStep);

  const [sessionId, setSessionId] = useState("");
  const [requirementSetId, setRequirementSetId] = useState("");
  const [runId, setRunId] = useState("");

  const [title, setTitle] = useState("Mozart Run");
  const [createdBy, setCreatedBy] = useState("portal");

  const [businessGoal, setBusinessGoal] = useState("Build a governed analytics platform");
  const [stakeholders, setStakeholders] = useState("Finance, Sales Ops, Data Team");
  const [successMetrics, setSuccessMetrics] = useState("Power BI KPIs, daily refresh, secure access");

  const [cloud, setCloud] = useState("azure");
  const [region, setRegion] = useState("westeurope");
  const [environment, setEnvironment] = useState("dev");

  const [piiPresent, setPiiPresent] = useState(true);
  const [gdprRequired, setGdprRequired] = useState(true);
  const [privateNetworking, setPrivateNetworking] = useState(true);
  const [budgetEurMonth, setBudgetEurMonth] = useState(3000);

  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  const canSubmitDraft = useMemo(() => {
    return !!requirementSetId && businessGoal.trim().length > 3 && region.trim().length > 2;
  }, [requirementSetId, businessGoal, region]);

  function pushTimeline(title: string, detail?: string) {
    setTimeline((t) => [{ at: now(), title, detail }, ...t]);
  }

  async function runSafe<T>(label: string, fn: () => Promise<T>) {
    try {
      setStatus("working");
      setError("");
      pushTimeline(label);
      const out = await fn();
      setStatus("ok");
      return out;
    } catch (e: any) {
      setStatus("error");
      const msg = e?.message || String(e);
      setError(msg);
      pushTimeline(`${label} failed`, msg);
      throw e;
    }
  }

  async function doIntake() {
    const s = await runSafe("Create BRD session", () =>
      brd.createSession({ created_by: createdBy, title })
    );
    setSessionId(s.session_id);

    const r = await runSafe("Create requirement set", () =>
      brd.createRequirementSet({ session_id: s.session_id, name: title })
    );

    const reqId = (r as any).requirement_set_id || (r as any).id;
    if (!reqId) throw new Error(`Requirement set response missing id: ${JSON.stringify(r)}`);
    setRequirementSetId(reqId);

    setStep("business_context");
  }

  async function saveBusinessContext() {
    if (!requirementSetId) throw new Error("Missing requirement_set_id (run Intake first)");

    await runSafe("Save business context", () =>
      brd.upsertBusinessContext(requirementSetId, {
        business_goal: businessGoal,
        stakeholders: splitCsvToList(stakeholders),         // ✅ backend expects list
        success_metrics: splitCsvToList(successMetrics),    // ✅ safe
      })
    );

    setStep("constraints");
  }

  async function saveConstraints() {
    if (!requirementSetId) throw new Error("Missing requirement_set_id (run Intake first)");

    await runSafe("Save constraints", () =>
      brd.upsertConstraints(requirementSetId, {
        cloud,
        region,
        environment,
      })
    );

    setStep("guardrails");
  }

  async function saveGuardrails() {
    if (!requirementSetId) throw new Error("Missing requirement_set_id (run Intake first)");

    await runSafe("Save guardrails", () =>
      brd.upsertGuardrails(requirementSetId, {
        pii_present: piiPresent,
        gdpr_required: gdprRequired,
        private_networking_required: privateNetworking,
        budget_eur_month: budgetEurMonth,
      })
    );

    setStep("review");
  }

  async function doSubmit() {
    if (!requirementSetId) throw new Error("Missing requirement_set_id");
    await runSafe("Submit requirement set", () => brd.submit(requirementSetId));
    setStep("approve");
  }

  async function doApprove() {
    if (!requirementSetId) throw new Error("Missing requirement_set_id");
    await runSafe("Approve requirement set", () => brd.approve(requirementSetId));
    setStep("plan");
  }

  async function doPlan() {
    if (!requirementSetId) throw new Error("Missing requirement_set_id");

    const p = await runSafe("Create deploy plan", () =>
      deploy.createPlan({
        requirement_set_id: requirementSetId,
        name_prefix: "zordrax",
        region,
        environment,
        enable_apim: false,
        backend_app_hostname: "example.azurewebsites.net",
      })
    );

    const rid = (p as any).run_id;
    if (!rid) throw new Error(`Deploy plan response missing run_id: ${JSON.stringify(p)}`);
    setRunId(rid);
    setStep("infra");
  }

  async function doInfra() {
    if (!runId) throw new Error("Missing run_id");
    await runSafe("Approve run (triggers infra pipeline)", () => deploy.approveRun(runId));
  }

  async function doRefresh() {
    if (!runId) throw new Error("Missing run_id");
    const r = await runSafe("Refresh run status", () => deploy.refresh(runId));
    pushTimeline("Run status", JSON.stringify(r));
    if ((r as any)?.status === "infra_succeeded") setStep("package");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mozart Onboarding</h1>
        <p className="text-slate-300 text-sm">BRD → Submit → Approve → Plan → Infra → Package</p>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="px-2 py-1 rounded bg-slate-800/60">session: {sessionId || "—"}</span>
          <span className="px-2 py-1 rounded bg-slate-800/60">reqset: {requirementSetId || "—"}</span>
          <span className="px-2 py-1 rounded bg-slate-800/60">run: {runId || "—"}</span>
          <span className="px-2 py-1 rounded bg-slate-800/60">status: {status}</span>
        </div>
      </div>

      {error ? (
        <div className="border border-red-900/60 bg-red-950/40 text-red-200 rounded-xl p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-3 p-4">
          <div className="text-white font-semibold mb-2">Steps</div>
          <div className="space-y-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={[
                  "w-full text-left rounded-xl border px-3 py-2",
                  step === s.id
                    ? "border-sky-500 bg-slate-900/60"
                    : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/40",
                ].join(" ")}
              >
                <div className="text-slate-100 text-sm font-medium">{s.label}</div>
                <div className="text-slate-400 text-xs">{s.sub}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-6 p-4">
          <div className="text-white font-semibold mb-3">{steps.find((x) => x.id === step)?.label}</div>

          {step === "intake" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Run title</div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Created by</div>
                  <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
                </div>
              </div>

              <Button onClick={doIntake} disabled={status === "working"}>
                Create session + requirement set
              </Button>
            </div>
          )}

          {step === "business_context" && (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Business goal</div>
                <Textarea value={businessGoal} onChange={(e) => setBusinessGoal(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Stakeholders (comma-separated)</div>
                <Input value={stakeholders} onChange={(e) => setStakeholders(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Success metrics (comma-separated)</div>
                <Textarea value={successMetrics} onChange={(e) => setSuccessMetrics(e.target.value)} />
              </div>

              <Button onClick={saveBusinessContext} disabled={status === "working" || !requirementSetId}>
                Save & Next
              </Button>
            </div>
          )}

          {step === "constraints" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Cloud</div>
                  <Input value={cloud} onChange={(e) => setCloud(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Region</div>
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Environment</div>
                  <Input value={environment} onChange={(e) => setEnvironment(e.target.value)} />
                </div>
              </div>

              <Button onClick={saveConstraints} disabled={status === "working" || !requirementSetId}>
                Save & Next
              </Button>
            </div>
          )}

          {step === "guardrails" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-slate-200 text-sm">
                  <input type="checkbox" checked={piiPresent} onChange={(e) => setPiiPresent(e.target.checked)} />
                  PII present
                </label>
                <label className="flex items-center gap-2 text-slate-200 text-sm">
                  <input type="checkbox" checked={gdprRequired} onChange={(e) => setGdprRequired(e.target.checked)} />
                  GDPR required
                </label>
                <label className="flex items-center gap-2 text-slate-200 text-sm">
                  <input
                    type="checkbox"
                    checked={privateNetworking}
                    onChange={(e) => setPrivateNetworking(e.target.checked)}
                  />
                  Private networking required
                </label>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Budget EUR/month</div>
                  <Input type="number" value={budgetEurMonth} onChange={(e) => setBudgetEurMonth(Number(e.target.value))} />
                </div>
              </div>

              <Button onClick={saveGuardrails} disabled={status === "working" || !requirementSetId}>
                Save & Next
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3 text-slate-200 text-sm">
              <div className="rounded-xl border border-slate-800 p-3 bg-slate-950/40">
                <div className="font-medium text-slate-100 mb-2">Review</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>session_id: {sessionId || "—"}</div>
                  <div>requirement_set_id: {requirementSetId || "—"}</div>
                  <div>cloud: {cloud}</div>
                  <div>region: {region}</div>
                  <div>env: {environment}</div>
                  <div>pii: {String(piiPresent)}</div>
                  <div>gdpr: {String(gdprRequired)}</div>
                  <div>private net: {String(privateNetworking)}</div>
                  <div>budget: €{budgetEurMonth}/mo</div>
                </div>
              </div>

              <Button onClick={() => setStep("submit")} disabled={!canSubmitDraft}>
                Continue to Submit
              </Button>
            </div>
          )}

          {step === "submit" && (
            <div className="space-y-3">
              <div className="text-slate-200 text-sm">This locks your draft requirement set and submits it.</div>
              <Button onClick={doSubmit} disabled={status === "working" || !canSubmitDraft}>
                Submit requirement set
              </Button>
            </div>
          )}

          {step === "approve" && (
            <div className="space-y-3">
              <div className="text-slate-200 text-sm">Approval gate: you must approve before planning.</div>
              <Button onClick={doApprove} disabled={status === "working" || !requirementSetId}>
                Approve requirement set
              </Button>
            </div>
          )}

          {step === "plan" && (
            <div className="space-y-3">
              <div className="text-slate-200 text-sm">Creates a deploy plan and returns a RUN_ID.</div>
              <Button onClick={doPlan} disabled={status === "working" || !requirementSetId}>
                Create deploy plan
              </Button>
            </div>
          )}

          {step === "infra" && (
            <div className="space-y-3">
              <div className="text-slate-200 text-sm">
                Approves the run (which triggers infra), then use Refresh to watch status.
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={doInfra} disabled={status === "working" || !runId}>
                  Approve run (trigger infra)
                </Button>
                <Button variant="outline" onClick={doRefresh} disabled={status === "working" || !runId}>
                  Refresh status
                </Button>
              </div>
            </div>
          )}

          {step === "package" && (
            <div className="space-y-3 text-slate-200 text-sm">
              <div className="rounded-xl border border-slate-800 p-3 bg-slate-950/40">
                <div className="text-slate-100 font-medium mb-2">Package summary</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>session_id: {sessionId}</div>
                  <div>requirement_set_id: {requirementSetId}</div>
                  <div>run_id: {runId}</div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setStep("infra")}>
                Back to Infra
              </Button>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-semibold">Timeline</div>
            <span className="text-xs px-2 py-1 rounded bg-slate-800/60 text-slate-200">{status}</span>
          </div>

          <div className="space-y-2">
            {timeline.length === 0 ? (
              <div className="text-slate-400 text-sm">No events yet.</div>
            ) : (
              timeline.map((t, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                  <div className="text-slate-100 text-sm font-medium">{t.title}</div>
                  <div className="text-slate-500 text-xs">{t.at}</div>
                  {t.detail ? <div className="text-slate-300 text-xs mt-1 break-words">{t.detail}</div> : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
