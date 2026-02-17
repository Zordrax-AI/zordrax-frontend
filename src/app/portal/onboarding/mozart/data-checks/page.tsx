"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ProfilingSummaryCard from "@/components/ProfilingSummaryCard";
import { client } from "@/lib/agent";
import { ProfilingSummary } from "@/lib/types";
import { getRequirementSetId, wizardHref } from "@/lib/wizard";

export const dynamic = "force-dynamic";

export default function ChecksPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[color:var(--muted)]">Loading...</div>}>
      <ChecksInner />
    </Suspense>
  );
}

function ChecksInner() {
  const search = useSearchParams();
  const router = useRouter();
  const requirementSetId = getRequirementSetId(search) ?? "";
  const tablesKey = requirementSetId ? `selected_tables:${requirementSetId}` : "";

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [summary, setSummary] = useState<ProfilingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !tablesKey) return;
    const saved = window.localStorage.getItem(tablesKey);
    if (saved) {
      try {
        setSelectedTables(JSON.parse(saved));
      } catch {
        setSelectedTables([]);
      }
    }
  }, [tablesKey]);

  useEffect(() => {
    if (!requirementSetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await client.getProfiling(requirementSetId);
        if (cancelled) return;
        setSummary(res as ProfilingSummary);
      } catch (e: any) {
        if (cancelled) return;
        setSummary(buildStubSummary(selectedTables));
        const msg = e?.message || "";
        if (!msg.includes("404")) {
          setError(msg || "Profiling not available yet. Using stub values.");
        } else {
          setError("No profiling yet. Using stub values.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requirementSetId, selectedTables]);

  const tablesCount = selectedTables.length;
  const continueHref = requirementSetId ? wizardHref("metrics-intent", requirementSetId) : "/portal/onboarding/mozart/metrics-intent";
  const tablesHref = requirementSetId
    ? `/portal/onboarding/mozart/tables?requirement_set_id=${encodeURIComponent(requirementSetId)}`
    : "/portal/onboarding/mozart/tables";

  const canSave = useMemo(() => !!requirementSetId, [requirementSetId]);

  async function saveProfiling() {
    if (!requirementSetId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload = {
      ...(summary || buildStubSummary(selectedTables)),
      selected_tables: selectedTables,
    };
    try {
      const res = await client.postProfiling(requirementSetId, payload);
      setSummary(res as ProfilingSummary);
      setMessage("Profiling saved");
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to save profiling");
    } finally {
      setSaving(false);
    }
  }

  if (!requirementSetId) {
    return (
      <div className="space-y-4 text-[color:var(--fg)]">
        <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-4 py-3 text-sm text-[color:var(--danger)]">
          requirement_set_id missing. Create a requirement set to continue.
        </div>
        <Button variant="primary" onClick={() => router.push("/onboarding/new")}>
          Create requirement set
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Profile & Checks</h1>
        <p className="text-sm text-[color:var(--muted)]">Summary of profiling signals and readiness.</p>
      </header>

      {error && (
        <div className="rounded-md border border-[color:var(--warning,#f59e0b)] bg-[color:var(--warning-bg,rgba(245,158,11,0.12))] px-3 py-2 text-xs text-[color:var(--warning-text,#b45309)]">
          {error}
        </div>
      )}

      <Card className="p-4 space-y-4">
        <div className="text-sm font-semibold">Selection</div>
        <div className="text-sm text-[color:var(--muted)]">
          Tables selected: <span className="font-semibold text-[color:var(--fg)]">{tablesCount}</span>
        </div>
        {tablesCount === 0 && (
          <div className="text-xs text-[color:var(--danger)]">No tables selected yet; profiling is limited.</div>
        )}
        <Link href={tablesHref} className="text-xs text-[color:var(--accent)] hover:underline">
          Revisit tables
        </Link>
      </Card>

      <ProfilingSummaryCard summary={summary || buildStubSummary(selectedTables)} />

      <div className="flex gap-3">
        <Button variant="outline" onClick={saveProfiling} disabled={!canSave || saving}>
          {saving ? "Saving..." : "Save profiling"}
        </Button>
        {message && <div className="text-sm text-[color:var(--success,#16a34a)]">{message}</div>}
      </div>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Warnings</div>
        <ul className="list-disc pl-5 text-sm text-[color:var(--muted)] space-y-1">
          <li>Some tables missing primary keys (stub)</li>
          <li>PII columns need tokenization (stub)</li>
        </ul>
      </Card>

      <div className="flex items-center justify-between">
        <Link href={tablesHref}>
          <Button variant="outline">Back to Tables</Button>
        </Link>
        <Link href={continueHref} aria-disabled={tablesCount === 0}>
          <Button variant="primary" disabled={tablesCount === 0 || loading}>
            Continue to KPIs
          </Button>
        </Link>
      </div>
    </div>
  );
}

function buildStubSummary(selectedTables: string[]): ProfilingSummary {
  return {
    totals: {
      tables: selectedTables.length || 3,
      rows_estimate: 50_000_000,
      size_bytes_estimate: 50_000_000 * 50,
    },
    biggest_tables: [
      { schema: "public", name: "customers", row_estimate: 25_000_000 },
      { schema: "public", name: "orders", row_estimate: 12_000_000 },
      { schema: "analytics", name: "events", row_estimate: 8_000_000 },
    ],
    pii_summary: { flagged_tables: 2, flags: { email: 2, phone: 1 } },
    refresh_plan: "daily",
    ingestion_recommendation: "batch-with-cdc",
  };
}
