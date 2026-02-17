"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export default function ChecksPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[color:var(--muted)]">Loading…</div>}>
      <ChecksInner />
    </Suspense>
  );
}

function ChecksInner() {
  const search = useSearchParams();
  const requirementSetId = search.get("requirement_set_id") || "";
  const tablesKey = requirementSetId ? `selected_tables:${requirementSetId}` : "";

  const [selectedTables, setSelectedTables] = useState<string[]>([]);

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

  const tablesCount = selectedTables.length;
  const continueHref = `/portal/onboarding/ai${requirementSetId ? `?requirement_set_id=${encodeURIComponent(requirementSetId)}` : ""}`;
  const tablesHref = `/portal/onboarding/mozart/tables${requirementSetId ? `?requirement_set_id=${encodeURIComponent(requirementSetId)}` : ""}`;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Profile & Checks</h1>
        <p className="text-sm text-[color:var(--muted)]">Quick summary of profiling signals and readiness.</p>
      </header>

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

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Checks Summary</div>
        <ul className="space-y-2 text-sm text-[color:var(--muted)]">
          <li>Biggest tables: customers, orders (stub)</li>
          <li>PII detected: yes (stub)</li>
          <li>Timestamps present: partial (stub)</li>
          <li>Suggested ingestion mode: batch with CDC fallback (stub)</li>
        </ul>
      </Card>

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
          <Button variant="primary" disabled={tablesCount === 0}>
            Continue to KPIs
          </Button>
        </Link>
      </div>
    </div>
  );
}
