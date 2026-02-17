"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
type KPI = { id: string; name: string; grain: string; dims: string };

export default function KpiIntentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[color:var(--muted)]">Loading…</div>}>
      <KpiInner />
    </Suspense>
  );
}

function KpiInner() {
  const search = useSearchParams();
  const requirementSetId = search.get("requirement_set_id") || "";
  const storageKey = requirementSetId ? `kpi_intent:${requirementSetId}` : "kpi_intent:default";

  const [name, setName] = useState("");
  const [grain, setGrain] = useState("daily");
  const [dims, setDims] = useState("");
  const [kpis, setKpis] = useState<KPI[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setKpis(JSON.parse(saved));
      } catch {
        setKpis([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(kpis));
  }, [kpis, storageKey]);

  function addKpi() {
    if (!name.trim()) return;
    setKpis((prev) => [
      { id: crypto.randomUUID(), name: name.trim(), grain, dims: dims.trim() },
      ...prev,
    ]);
    setName("");
    setDims("");
  }

  function removeKpi(id: string) {
    setKpis((prev) => prev.filter((k) => k.id !== id));
  }

  const checksHref = `/portal/onboarding/mozart/data-checks${requirementSetId ? `?requirement_set_id=${encodeURIComponent(requirementSetId)}` : ""}`;
  const recHref = `/portal/onboarding/mozart/recommendations${requirementSetId ? `?requirement_set_id=${encodeURIComponent(requirementSetId)}` : ""}`;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">KPI Intent</h1>
        <p className="text-sm text-[color:var(--muted)]">Capture the KPIs you want the package to track.</p>
      </header>

      <Card className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[color:var(--muted)]">KPI description</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="% of Sales"
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[color:var(--muted)]">Time grain</label>
            <select
              value={grain}
              onChange={(e) => setGrain(e.target.value)}
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[color:var(--muted)]">Dimensions (comma separated)</label>
            <input
              value={dims}
              onChange={(e) => setDims(e.target.value)}
              placeholder="country, channel"
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>
          <Button variant="primary" onClick={addKpi} disabled={!name.trim()}>
            Add KPI
          </Button>
        </div>

        {kpis.length === 0 && (
          <div className="rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)]">
            No KPIs added yet.
          </div>
        )}

        {kpis.length > 0 && (
          <div className="space-y-2">
            {kpis.map((k) => (
              <div
                key={k.id}
                className="flex items-start justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2"
              >
                <div className="space-y-1">
                  <div className="text-sm text-[color:var(--fg)]">{k.name}</div>
                  <div className="text-xs text-[color:var(--muted)]">
                    Grain: {k.grain} | Dims: {k.dims || "none"}
                  </div>
                </div>
                <Button variant="outline" onClick={() => removeKpi(k.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href={checksHref}>
          <Button variant="outline">Back to Checks</Button>
        </Link>
        <Link href={recHref} aria-disabled={kpis.length === 0}>
          <Button variant="primary" disabled={kpis.length === 0}>
            Continue to Recommendations
          </Button>
        </Link>
      </div>
    </div>
  );
}
