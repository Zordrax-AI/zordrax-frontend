"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { upsertGuardrails } from "@/lib/api";

export default function CostGovernanceClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [budget, setBudget] = useState<string>("");
  const [piiPresent, setPiiPresent] = useState(false);
  const [gdprRequired, setGdprRequired] = useState(false);
  const [privateNetworkingRequired, setPrivateNetworkingRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBudget(window.localStorage.getItem("za_budget_eur_month") ?? "");
    setPiiPresent((window.localStorage.getItem("za_pii_present") ?? "false") === "true");
    setGdprRequired((window.localStorage.getItem("za_gdpr_required") ?? "false") === "true");
    setPrivateNetworkingRequired((window.localStorage.getItem("za_private_networking_required") ?? "false") === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("za_budget_eur_month", budget);
    window.localStorage.setItem("za_pii_present", String(piiPresent));
    window.localStorage.setItem("za_gdpr_required", String(gdprRequired));
    window.localStorage.setItem("za_private_networking_required", String(privateNetworkingRequired));
  }, [budget, piiPresent, gdprRequired, privateNetworkingRequired]);

  function goNext() {
    if (!requirementSetId) return;
    const num = Number(budget);
    if (!num || Number.isNaN(num) || num <= 0) {
      setError("Budget is required");
      return;
    }

    upsertGuardrails(requirementSetId, {
      budget_eur_month: num,
      pii_present: Boolean(piiPresent),
      gdpr_required: Boolean(gdprRequired),
      private_networking_required: Boolean(privateNetworkingRequired),
    })
      .then(() => {
        setError(null);
        router.push(`/portal/onboarding/mozart/deploy?requirement_set_id=${encodeURIComponent(requirementSetId)}`);
      })
      .catch((e: any) => setError(e?.message || "Failed to save guardrails"));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Cost + Governance</h1>
        <p className="mt-1 text-sm text-slate-400">
          Phase E placeholder. Next: cost breakdown + governance posture + confidence scoring.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="text-sm text-slate-200">
          Requirement Set: <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>

        <div className="space-y-3 text-sm text-slate-200">
          <label className="space-y-1 block">
            <div className="text-xs uppercase tracking-wide text-slate-500">Monthly budget (EUR)</div>
            <input
              type="number"
              min="1"
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--fg)]"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 5000"
            />
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={piiPresent} onChange={(e) => setPiiPresent(e.target.checked)} />
            <span>PII present</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={gdprRequired} onChange={(e) => setGdprRequired(e.target.checked)} />
            <span>GDPR required</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={privateNetworkingRequired}
              onChange={(e) => setPrivateNetworkingRequired(e.target.checked)}
            />
            <span>Private networking required</span>
          </label>
        </div>

        {error && <div className="rounded-md border border-red-500/40 bg-red-900/30 p-3 text-sm text-red-100">{error}</div>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={goNext} disabled={!requirementSetId}>
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
