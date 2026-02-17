"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { zaFetch } from "@/lib/za";
import StageTimeline from "@/components/StageTimeline";

type FormState = Record<string, any>;

export const dynamic = "force-dynamic";

export default function RequirementSetPage() {
  const params = useParams<{ reqSetId: string }>();
  const id = params?.reqSetId || "";

  const [business, setBusiness] = useState<FormState>({
    pii_present: false,
    gdpr_required: false,
    budget_eur_month: "",
    private_networking_required: false,
    stakeholders: "",
  });
  const [constraints, setConstraints] = useState<FormState>({
    cloud: "",
    region: "",
    environment: "",
  });
  const [guardrails, setGuardrails] = useState<FormState>({
    data_residency: "",
    data_retention_days: "",
  });
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [planRunId, setPlanRunId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const rs = await zaFetch(`/api/brd/requirement-sets/${id}`, { method: "GET" });
      const nextStatus = rs?.status || rs?.state;
      if (nextStatus) setStatus(nextStatus);
    } catch (e) {
      // best-effort; keep existing status
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchStatus();
  }, [id, fetchStatus]);

  async function update(endpoint: string, body: any, loadingKey: string) {
    setLoading(loadingKey);
    setError(null);
    setMessage(null);
    try {
      await zaFetch(endpoint, { method: "PUT", body });
      setMessage("Saved");
    } catch (e: any) {
      const msg = normalizeError(e);
      setError(msg);
    } finally {
      setLoading(null);
    }
  }

  async function submit() {
    await runAction(`/api/brd/requirement-sets/${id}/submit`, "Submitting…", "Submit");
    await fetchStatus();
  }
  async function approve() {
    await runAction(`/api/brd/requirement-sets/${id}/approve`, "Approving…", "Approve");
    await fetchStatus();
  }
  async function createPlan() {
    setLoading("plan");
    setError(null);
    try {
      const planPayload = {
        requirement_set_id: id,
        name_prefix: "zordrax",
        region: "westeurope",
        environment: "dev",
        enable_apim: false,
        backend_app_hostname: "example.azurewebsites.net",
      };
      const res = await zaFetch("/api/deploy/plan", { method: "POST", body: planPayload });
      const runId = res?.run_id;
      setPlanRunId(runId);
      setMessage("Deploy plan created");
    } catch (e: any) {
      setError(normalizeError(e) || "Failed to create plan");
    } finally {
      setLoading(null);
    }
  }

  async function runAction(path: string, loadingText: string, key: string) {
    setLoading(key);
    setError(null);
    try {
      await zaFetch(path, { method: "POST" });
      setMessage(`${key} ok`);
    } catch (e: any) {
      setError(normalizeError(e) || `${key} failed`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Requirement Set</h1>
            <div className="text-xs text-[color:var(--muted)] break-all">ID: {id}</div>
          </div>
          <StageTimeline current={status} />
        </div>
      </header>

      {status && status.toLowerCase() !== "draft" && (
        <div className="rounded-md border border-[color:var(--warning,#f59e0b)] bg-[color:var(--warning-bg,rgba(245,158,11,0.12))] px-3 py-2 text-sm text-[color:var(--warning-text,#b45309)]">
          Requirement set is {status}. Editing is locked. Create a new requirement set to modify.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-3 py-2 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))] px-3 py-2 text-sm text-[color:var(--success)]">
          {message}
        </div>
      )}

      <Card className="p-4 space-y-4">
        <div className="text-sm font-semibold">Business Context</div>
        <div className="grid gap-3 md:grid-cols-2">
          <LabeledInput disabled={!isDraft(status)} label="Budget EUR / month" value={business.budget_eur_month} onChange={(v) => setBusiness({ ...business, budget_eur_month: v })} />
          <LabeledInput disabled={!isDraft(status)} label="Stakeholders (comma separated)" value={business.stakeholders} onChange={(v) => setBusiness({ ...business, stakeholders: v })} />
          <Checkbox disabled={!isDraft(status)} label="PII present" checked={business.pii_present} onChange={(v) => setBusiness({ ...business, pii_present: v })} />
          <Checkbox disabled={!isDraft(status)} label="GDPR required" checked={business.gdpr_required} onChange={(v) => setBusiness({ ...business, gdpr_required: v })} />
          <Checkbox disabled={!isDraft(status)} label="Private networking required" checked={business.private_networking_required} onChange={(v) => setBusiness({ ...business, private_networking_required: v })} />
        </div>
        <Button
          variant="outline"
          onClick={() =>
            update(
              `/api/brd/requirement-sets/${id}/business-context`,
              normalizeBusinessPayload(business),
              "business"
            )
          }
          disabled={loading === "business" || !isDraft(status)}
        >
          {loading === "business" ? "Saving…" : "Save business context"}
        </Button>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="text-sm font-semibold">Constraints</div>
        <div className="grid gap-3 md:grid-cols-3">
          <LabeledInput disabled={!isDraft(status)} label="Cloud" value={constraints.cloud} onChange={(v) => setConstraints({ ...constraints, cloud: v })} />
          <LabeledInput disabled={!isDraft(status)} label="Region" value={constraints.region} onChange={(v) => setConstraints({ ...constraints, region: v })} />
          <LabeledInput disabled={!isDraft(status)} label="Environment" value={constraints.environment} onChange={(v) => setConstraints({ ...constraints, environment: v })} />
        </div>
        <Button variant="outline" onClick={() => update(`/api/brd/constraints/${id}`, constraints, "constraints")} disabled={loading === "constraints" || !isDraft(status)}>
          {loading === "constraints" ? "Saving…" : "Save constraints"}
        </Button>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="text-sm font-semibold">Guardrails</div>
        <div className="grid gap-3 md:grid-cols-2">
          <LabeledInput disabled={!isDraft(status)} label="Data residency" value={guardrails.data_residency} onChange={(v) => setGuardrails({ ...guardrails, data_residency: v })} />
          <LabeledInput disabled={!isDraft(status)} label="Data retention days" value={guardrails.data_retention_days} onChange={(v) => setGuardrails({ ...guardrails, data_retention_days: v })} />
        </div>
        <Button variant="outline" onClick={() => update(`/api/brd/guardrails/${id}`, guardrails, "guardrails")} disabled={loading === "guardrails" || !isDraft(status)}>
          {loading === "guardrails" ? "Saving…" : "Save guardrails"}
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={submit} disabled={loading === "Submit"}>
            {loading === "Submit" ? "Submitting…" : "Submit"}
          </Button>
          <Button variant="outline" onClick={approve} disabled={loading === "Approve"}>
            {loading === "Approve" ? "Approving…" : "Approve"}
          </Button>
          <Button variant="primary" onClick={createPlan} disabled={loading === "plan"}>
            {loading === "plan" ? "Creating plan…" : "Create Deploy Plan"}
          </Button>
          {planRunId && (
            <Link href={`/deploy/${encodeURIComponent(planRunId)}`} className="text-[color:var(--accent)] underline">
              View deploy run {planRunId}
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string | number | boolean;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="text-sm text-[color:var(--muted)] space-y-1">
      <span className="block">{label}</span>
      <input
        value={value as any}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[color:var(--fg)]">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function isDraft(status?: string) {
  if (!status) return true;
  return status.toLowerCase() === "draft";
}

function normalizeError(e: any) {
  const msg = e?.message || "";
  if (msg.toLowerCase().includes("409") || msg.toLowerCase().includes("allowed")) {
    return "Requirement set is locked (status is not draft). Create a new requirement set to modify.";
  }
  return msg || "Request failed";
}

function normalizeBusinessPayload(src: FormState) {
  const stakeholdersRaw = typeof src.stakeholders === "string" ? src.stakeholders : "";
  const stakeholders = stakeholdersRaw
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const budgetNum = src.budget_eur_month === "" ? undefined : Number(src.budget_eur_month);
  return {
    ...src,
    stakeholders,
    budget_eur_month: Number.isFinite(budgetNum) ? budgetNum : undefined,
    pii_present: !!src.pii_present,
    gdpr_required: !!src.gdpr_required,
    private_networking_required: !!src.private_networking_required,
  };
}
