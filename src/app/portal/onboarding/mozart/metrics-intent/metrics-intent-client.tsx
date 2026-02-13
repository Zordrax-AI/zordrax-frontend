"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  brdReadRequirementSet,
  getConnector,
  getConstraints,
  updateConstraints,
  getMetricsSuggestions,
  type Connector,
} from "@/lib/api";

type Metric = {
  name: string;
  definition: string;
  tables: string[];
  grain?: string;
  joins?: string;
  checks?: string[];
};

export default function MetricsIntentClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [connector, setConnector] = useState<Connector | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requirementSetId) return;
    (async () => {
      try {
        setLoading(true);
        const [rs, constraints] = await Promise.all([
          brdReadRequirementSet(requirementSetId),
          getConstraints(requirementSetId).catch(() => ({})),
        ]);
        if (rs.connector_id) {
          const conn = await getConnector(rs.connector_id).catch(() => null);
          if (conn) setConnector(conn);
        }
        const cj = (constraints as any)?.constraints_json || constraints || {};
        if (cj.metrics_intent) setMetrics(cj.metrics_intent as Metric[]);

        // pull suggestions (placeholder endpoint)
        try {
          const sug = await getMetricsSuggestions(requirementSetId);
          if (sug?.metrics?.length) {
            setMetrics((prev) =>
              prev.length ? prev : sug.metrics.map(normalizeMetric)
            );
          }
        } catch {
          /* ignore suggestions failure */
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, [requirementSetId]);

  function updateMetric(idx: number, patch: Partial<Metric>) {
    setMetrics((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addMetric() {
    setMetrics((prev) => [
      ...prev,
      { name: "New KPI", definition: "", tables: [], grain: "", joins: "", checks: [] },
    ]);
  }

  function removeMetric(idx: number) {
    setMetrics((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!requirementSetId) return;
    setSaving(true);
    setError("");
    try {
      await updateConstraints(requirementSetId, { metrics_intent: metrics });
      router.push(
        `/portal/onboarding/mozart/recommendations?requirement_set_id=${encodeURIComponent(requirementSetId)}`
      );
    } catch (e: any) {
      setError(e?.message || "Failed to save metrics intent");
    } finally {
      setSaving(false);
    }
  }

  const canContinue = useMemo(() => metrics.length > 0, [metrics]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm uppercase text-slate-500 font-semibold">Metrics intent</div>
            <div className="text-2xl font-semibold text-slate-900">Define the KPIs you care about</div>
            {connector && (
              <div className="text-sm text-slate-600 mt-1">
                Using connector: {connector.name} ({connector.type})
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={addMetric}>
              Add metric
            </Button>
            <Button onClick={save} disabled={saving || !canContinue}>
              {saving ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading && <div className="text-sm text-slate-600">Loading suggestions...</div>}

        <div className="grid gap-4">
          {metrics.map((m, idx) => (
            <Card key={idx} className="p-4 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={m.name}
                  onChange={(e) => updateMetric(idx, { name: e.target.value })}
                  className="font-semibold text-lg bg-white border-slate-300"
                />
                <Button variant="ghost" onClick={() => removeMetric(idx)}>
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Definition"
                  value={m.definition}
                  onChange={(v) => updateMetric(idx, { definition: v })}
                  placeholder="How is this KPI calculated?"
                  multiline
                />
                <Field
                  label="Tables (comma separated)"
                  value={m.tables.join(", ")}
                  onChange={(v) =>
                    updateMetric(idx, {
                      tables: v
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="public.orders, public.customers"
                />
                <Field
                  label="Grain"
                  value={m.grain || ""}
                  onChange={(v) => updateMetric(idx, { grain: v })}
                  placeholder="e.g., daily, customer_id"
                />
                <Field
                  label="Join paths"
                  value={m.joins || ""}
                  onChange={(v) => updateMetric(idx, { joins: v })}
                  placeholder="orders.customer_id -> customers.customer_id"
                />
                <Field
                  label="Checks (comma separated)"
                  value={(m.checks || []).join(", ")}
                  onChange={(v) => updateMetric(idx, { checks: v.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="not_null, referential_integrity"
                />
              </div>
            </Card>
          ))}

          {metrics.length === 0 && (
            <Card className="p-6 bg-white border border-slate-200 shadow-sm text-sm text-slate-700">
              No metrics yet. Use “Add metric” to start or wait for suggestions.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm text-slate-700">
      <span className="text-xs text-slate-500">{label}</span>
      {multiline ? (
        <textarea
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white border-slate-300"
        />
      )}
    </label>
  );
}

function normalizeMetric(m: any): Metric {
  return {
    name: m.name || "KPI",
    definition: m.definition || "",
    tables: m.tables || [],
    grain: m.grain,
    joins: m.joins,
    checks: m.checks || [],
  };
}
