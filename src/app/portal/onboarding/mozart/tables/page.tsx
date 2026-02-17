"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
type TableItem = { id: string; schema?: string; table: string };

const STUB_TABLES: TableItem[] = [
  { id: "public.customers", schema: "public", table: "customers" },
  { id: "public.orders", schema: "public", table: "orders" },
  { id: "analytics.events", schema: "analytics", table: "events" },
];

export default function TablesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[color:var(--muted)]">Loading…</div>}>
      <TablesInner />
    </Suspense>
  );
}

function TablesInner() {
  const search = useSearchParams();
  const router = useRouter();
  const requirementSetId = search.get("requirement_set_id") || "";
  const connectorId = search.get("connector_id") || "";

  const storageKey = requirementSetId ? `selected_tables:${requirementSetId}` : "";

  const [tables, setTables] = useState<TableItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Load saved selection
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSelected(new Set(JSON.parse(saved)));
      } catch {
        setSelected(new Set());
      }
    }
  }, [storageKey]);

  // Persist selection
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(selected)));
  }, [selected, storageKey]);

  const hasRequirement = Boolean(requirementSetId);

  async function discoverTables() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!connectorId) {
        setTables(STUB_TABLES);
        setMessage("Loaded stub tables. No connector_id provided.");
        return;
      }
      const res = await fetch(`/api/connectors/${encodeURIComponent(connectorId)}/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Discover failed (${res.status})`);
      }
      const data = await res.json();
      const parsed = extractTables(data);
      setTables(parsed);
      setMessage(`Discovered ${parsed.length} table${parsed.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      setError(e?.message || "Failed to discover tables");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(tables.map((t) => t.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const filteredTables = useMemo(() => tables, [tables]);

  const continueHref = `/portal/onboarding/checks${requirementSetId ? `?requirement_set_id=${encodeURIComponent(requirementSetId)}` : ""}`;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Select Tables</h1>
        <p className="text-sm text-[color:var(--muted)]">Choose the tables to include in this package.</p>
        {!hasRequirement && (
          <div className="rounded-md border border-[color:var(--warning, #f59e0b)] bg-[color:var(--warning-bg,rgba(245,158,11,0.12))] px-3 py-2 text-xs text-[color:var(--warning-text,#b45309)]">
            requirement_set_id missing; selections will still work locally but may not save to the backend.
          </div>
        )}
      </header>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={discoverTables} disabled={loading}>
            {loading ? "Discovering…" : "Discover tables"}
          </Button>
          <Button variant="outline" onClick={selectAll} disabled={!tables.length}>
            Select all
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={!tables.length}>
            Clear
          </Button>
        </div>

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

        {!tables.length && !loading && (
          <div className="rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)]">
            No tables yet. Click “Discover tables” to load them.
          </div>
        )}

        {filteredTables.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {filteredTables.map((t) => {
              const checked = selected.has(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-start gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={checked}
                    onChange={() => toggle(t.id)}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[color:var(--fg)]">
                      {t.schema ? `${t.schema}.` : ""}
                      {t.table}
                    </span>
                    <div className="flex gap-2 text-[10px] text-[color:var(--muted)]">
                      <span className="rounded bg-[color:var(--card-2)] px-2 py-0.5">PII</span>
                      <span className="rounded bg-[color:var(--card-2)] px-2 py-0.5">No PK</span>
                      <span className="rounded bg-[color:var(--card-2)] px-2 py-0.5">No Timestamp</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/portal/onboarding/connect">
          <Button variant="outline">Back</Button>
        </Link>
        <Link href={continueHref} aria-disabled={selected.size === 0}>
          <Button variant="primary" disabled={selected.size === 0}>
            Continue
          </Button>
        </Link>
      </div>
    </div>
  );
}

function extractTables(data: any): TableItem[] {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.tables)) {
    return data.tables.map((t: any) => {
      const str = String(t);
      const [schema, table] = str.includes(".") ? str.split(".") : [undefined, str];
      return { id: str, schema, table: table || str };
    });
  }
  if (data.discovered_schema_json && typeof data.discovered_schema_json === "object") {
    return Object.keys(data.discovered_schema_json).map((k) => {
      const [schema, table] = k.includes(".") ? k.split(".") : [undefined, k];
      return { id: k, schema, table: table || k };
    });
  }
  return [];
}
