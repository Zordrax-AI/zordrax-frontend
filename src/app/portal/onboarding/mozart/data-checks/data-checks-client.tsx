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
  discoverConnector,
  profileConnector,
  type Connector,
} from "@/lib/api";
import { SelectedTablesPanel } from "@/components/connectors/SelectedTablesPanel";
import { SetupGuidePanel } from "../connect-data/SetupGuidePanel";
import { getRequirementSetId, wizardHref } from "@/lib/wizard";

const volumePresets = [
  { key: "small", label: "Small (<1M rows)" },
  { key: "medium", label: "Medium (1M-100M)" },
  { key: "large", label: "Large (100M+)" },
];

const transforms = [
  { key: "dedupe", label: "Deduplicate records" },
  { key: "type_standardization", label: "Standardize data types" },
  { key: "parse_timestamps", label: "Parse timestamps" },
  { key: "joins", label: "Join across sources" },
  { key: "scd2", label: "Slowly changing dimensions (SCD2)" },
  { key: "enrichment", label: "Enrichment from reference data" },
];

const quality = [
  { key: "not_null", label: "Not null checks" },
  { key: "unique_key", label: "Unique key checks" },
  { key: "referential_integrity", label: "Referential integrity" },
  { key: "value_ranges", label: "Value ranges" },
  { key: "freshness", label: "Freshness alerts" },
  { key: "schema_drift", label: "Schema drift alerts" },
];

function mockProfiling(tables: { schema: string; table: string }[]) {
  const now = new Date().toISOString();
  const result = tables.map((t, i) => {
    const keyCandidate = t.table.endsWith("_id") ? t.table : `${t.table}_id`;
    const nullRisk = i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low";
    return {
      schema: t.schema,
      table: t.table,
      est_rows: 100000 * (i + 1),
      null_risk: nullRisk,
      key_candidate: keyCandidate,
      freshness: "unknown",
      notes: "",
    };
  });
  return { generated_at: now, tables: result };
}

export default function DataChecksClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const requirementSetId = getRequirementSetId(sp) ?? "";

  const [connector, setConnector] = useState<Connector | null>(null);
  const [selectedTables, setSelectedTables] = useState<{ schema: string; table: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [constraintsCache, setConstraintsCache] = useState<Record<string, any>>({});

  // Form state
  const [refreshFrequency, setRefreshFrequency] = useState("daily");
  const [latency, setLatency] = useState("24h");
  const [pii, setPii] = useState(false);
  const [gdpr, setGdpr] = useState(false);
  const [privateNet, setPrivateNet] = useState(false);
  const [volumeBucket, setVolumeBucket] = useState("medium");
  const [largestRows, setLargestRows] = useState(50000000);
  const [tablesCount, setTablesCount] = useState(0);
  const [transSelected, setTransSelected] = useState<Record<string, boolean>>({});
  const [qualitySelected, setQualitySelected] = useState<Record<string, boolean>>({});
  const [transNotes, setTransNotes] = useState("");
  const [qualityNotes, setQualityNotes] = useState("");
  const [archMedallion, setArchMedallion] = useState("unsure");
  const [archStar, setArchStar] = useState("unsure");
  const [archStreaming, setArchStreaming] = useState("unsure");
  const [profiling, setProfiling] = useState<any>(null);
  const [profilingSummary, setProfilingSummary] = useState<any>(null);

  useEffect(() => {
    if (!requirementSetId) return;
    (async () => {
      try {
        const rs = await brdReadRequirementSet(requirementSetId);
        if (rs.connector_id) {
          const conn = await getConnector(rs.connector_id);
          setConnector(conn);
        }
        const c = await getConstraintsSafe(requirementSetId);
        const cj = (c as any)?.constraints_json || {};
        setConstraintsCache(cj);
        const dc = cj.data_checks || {};
        setRefreshFrequency(dc.refresh_frequency || "daily");
        setLatency(dc.latency_target || "24h");
        setPii(!!dc.pii_present);
        setGdpr(!!dc.gdpr_required);
        setPrivateNet(!!dc.private_networking);
        setVolumeBucket(dc.expected_volume?.bucket || "medium");
        setLargestRows(dc.expected_volume?.largest_table_rows || 50000000);
        const selTables =
          (cj.selected_tables && (cj.selected_tables as any).tables) ||
          cj.selected_tables ||
          dc.selected_tables ||
          [];
        setTablesCount(dc.expected_volume?.tables_count || selTables.length || 0);
        setSelectedTables(selTables);
        setTransSelected(arrayToMap(dc.transformations?.selected));
        setQualitySelected(arrayToMap(dc.quality_checks?.selected));
        setTransNotes(dc.transformations?.notes || "");
        setQualityNotes(dc.quality_checks?.notes || "");
        if (dc.architecture) {
          setArchMedallion(dc.architecture.medallion || "unsure");
          setArchStar(dc.architecture.star_schema || "unsure");
          setArchStreaming(dc.architecture.streaming || "unsure");
        }
        if (dc.profiling_results) setProfiling(dc.profiling_results);
        if (dc.profiling_summary) setProfilingSummary(dc.profiling_summary);
      } catch (e: any) {
        setError(e?.message || "Failed to load data checks");
      }
    })();
  }, [requirementSetId]);

  async function getConstraintsSafe(id: string) {
    try {
      const res = await getConstraints(id);
      return res;
    } catch {
      return {};
    }
  }

  async function runChecks() {
    setLoading(true);
    setError("");
    try {
      if (connector?.id) {
        const prof = await profileConnector(connector.id).catch(() => null);
        if (prof) {
          setProfilingSummary(prof as any);
          const tables = (prof as any).largest_tables?.map((t: any) => ({ schema: t.schema, table: t.table })) || [];
          if (tables.length) setProfiling(mockProfiling(tables));
          return;
        }
      }
      if (connector?.id) {
        await discoverConnector(connector.id).catch(() => {});
        const fresh = await getConnector(connector.id).catch(() => null);
        const discovered = (fresh as any)?.discovered_schema_json;
        if (discovered && Object.keys(discovered).length) {
          const tables = flattenDiscovered(discovered);
          setProfiling(mockProfiling(tables));
          setProfilingSummary(buildMockSummary(tables));
          return;
        }
      }
      const fallbackTables = selectedTables.length ? selectedTables : [{ schema: "public", table: "customers" }];
      setProfiling(mockProfiling(fallbackTables));
      setProfilingSummary(buildMockSummary(fallbackTables));
    } catch (e: any) {
      setError(e?.message || "Checks failed (mock shown)");
      setProfiling(mockProfiling(selectedTables));
      setProfilingSummary(buildMockSummary(selectedTables));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!requirementSetId) return;
    setLoading(true);
    setError("");
    try {
      const selectedTablesPayload = selectedTables;
      const payload = {
        selected_tables: selectedTablesPayload.length ? selectedTablesPayload : undefined,
        profiling_summary: profilingSummary || undefined,
        data_checks: {
          refresh_frequency: refreshFrequency,
          latency_target: latency,
          pii_present: pii,
          gdpr_required: gdpr,
          private_networking: privateNet,
          expected_volume: {
            bucket: volumeBucket,
            largest_table_rows: largestRows,
            tables_count: tablesCount || selectedTablesPayload.length || undefined,
          },
          transformations: {
            selected: mapToArray(transSelected),
            notes: transNotes,
          },
          quality_checks: {
            selected: mapToArray(qualitySelected),
            notes: qualityNotes,
          },
          architecture: {
            medallion: archMedallion,
            star_schema: archStar,
            streaming: archStreaming,
          },
          profiling_results: profiling || mockProfiling(selectedTablesPayload.length ? selectedTablesPayload : []),
        },
      };

      const merged = mergeConstraints(constraintsCache, payload);
      await updateConstraints(requirementSetId, merged);
      router.push(wizardHref("metrics-intent", requirementSetId));
    } catch (e: any) {
      setError(e?.message || "Failed to save data checks");
    } finally {
      setLoading(false);
    }
  }

  const selectedKeys = useMemo(() => selectedTables.map((t) => `${t.schema}.${t.table}`), [selectedTables]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm uppercase text-slate-500 font-semibold">Data Checks</div>
          <div className="text-2xl font-semibold text-slate-900">Validate your dataset</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runChecks} disabled={loading}>
            {loading ? "Running..." : "Run profiling"}
          </Button>
          <Button onClick={save} disabled={loading}>
            Save & Continue
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Card className="p-4 border border-slate-200 shadow-sm bg-white space-y-3">
            <div className="text-sm font-semibold">Dataset overview</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <SelectField label="Expected volume" value={volumeBucket} onChange={setVolumeBucket} options={volumePresets} />
              <Field label="Largest table rows" type="number" value={largestRows} onChange={(v) => setLargestRows(Number(v) || 0)} />
              <Field label="Tables count" type="number" value={tablesCount} onChange={(v) => setTablesCount(Number(v) || 0)} />
              <SelectField
                label="Refresh frequency"
                value={refreshFrequency}
                onChange={setRefreshFrequency}
                options={[
                  { key: "realtime", label: "Realtime" },
                  { key: "hourly", label: "Hourly" },
                  { key: "daily", label: "Daily" },
                  { key: "weekly", label: "Weekly" },
                  { key: "manual", label: "Manual" },
                ]}
              />
              <SelectField
                label="Latency target"
                value={latency}
                onChange={setLatency}
                options={[
                  { key: "1h", label: "1 hour" },
                  { key: "4h", label: "4 hours" },
                  { key: "12h", label: "12 hours" },
                  { key: "24h", label: "24 hours" },
                  { key: "48h", label: "48 hours" },
                ]}
              />
              <Checkbox label="PII present" checked={pii} onChange={setPii} />
              <Checkbox label="GDPR required" checked={gdpr} onChange={setGdpr} />
              <Checkbox label="Private networking required" checked={privateNet} onChange={setPrivateNet} />
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 shadow-sm bg-white space-y-3">
            <div className="text-sm font-semibold">Transformations needed</div>
            <CheckboxGrid items={transforms} state={transSelected} onToggle={toggleMap(transSelected, setTransSelected)} />
            <Field label="Notes" value={transNotes} onChange={setTransNotes} />
          </Card>

          <Card className="p-4 border border-slate-200 shadow-sm bg-white space-y-3">
            <div className="text-sm font-semibold">Data quality checks</div>
            <CheckboxGrid items={quality} state={qualitySelected} onToggle={toggleMap(qualitySelected, setQualitySelected)} />
            <Field label="Notes" value={qualityNotes} onChange={setQualityNotes} />
          </Card>

          <Card className="p-4 border border-slate-200 shadow-sm bg-white space-y-3">
            <div className="text-sm font-semibold">Architecture preferences</div>
            <RadioGroup
              label="Medallion (bronze/silver/gold)"
              value={archMedallion}
              onChange={setArchMedallion}
              options={[
                { key: "yes", label: "Yes" },
                { key: "no", label: "No" },
                { key: "unsure", label: "Unsure" },
              ]}
            />
            <RadioGroup
              label="Star schema / marts required"
              value={archStar}
              onChange={setArchStar}
              options={[
                { key: "yes", label: "Yes" },
                { key: "no", label: "No" },
                { key: "unsure", label: "Unsure" },
              ]}
            />
            <RadioGroup
              label="Streaming required"
              value={archStreaming}
              onChange={setArchStreaming}
              options={[
                { key: "yes", label: "Yes" },
                { key: "no", label: "No" },
                { key: "unsure", label: "Unsure" },
              ]}
            />
          </Card>

          {profiling && (
            <Card className="p-4 border border-slate-200 shadow-sm bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Quick estimate (preview)</div>
                <div className="text-xs text-slate-500">{profiling.generated_at}</div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left py-2 px-2">Table</th>
                      <th className="text-left py-2 px-2">Est. rows</th>
                      <th className="text-left py-2 px-2">Null risk</th>
                      <th className="text-left py-2 px-2">Key candidate</th>
                      <th className="text-left py-2 px-2">Freshness</th>
                      <th className="text-left py-2 px-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiling.tables.map((t: any, idx: number) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="py-2 px-2 font-mono text-slate-800">
                          {t.schema}.{t.table}
                        </td>
                        <td className="py-2 px-2 text-slate-700">{t.est_rows?.toLocaleString?.() ?? "—"}</td>
                        <td className="py-2 px-2 text-slate-700">{t.null_risk ?? "unknown"}</td>
                        <td className="py-2 px-2 text-slate-700">{t.key_candidate ?? "—"}</td>
                        <td className="py-2 px-2 text-slate-700">{t.freshness ?? "unknown"}</td>
                        <td className="py-2 px-2 text-slate-700">{t.notes ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {profilingSummary && (
            <Card className="p-4 border border-slate-200 shadow-sm bg-white space-y-3">
              <div className="text-sm font-semibold">Profiling summary</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-slate-800">
                <SummaryStat label="Tables" value={profilingSummary.table_count ?? "—"} />
                <SummaryStat
                  label="Total size (est)"
                  value={
                    profilingSummary.total_size_bytes_estimate
                      ? formatBytes(profilingSummary.total_size_bytes_estimate)
                      : "—"
                  }
                />
                <SummaryStat label="Suggested refresh" value={profilingSummary.suggested_refresh ?? "—"} />
                <SummaryStat label="Suggested ingestion" value={profilingSummary.suggested_ingestion_mode ?? "—"} />
                <SummaryStat
                  label="Suggested checks"
                  value={(profilingSummary.suggested_checks || []).join(", ") || "—"}
                />
              </div>

              {profilingSummary.largest_tables?.length ? (
                <div>
                  <div className="text-xs uppercase text-slate-500 mb-1">Top 10 largest tables</div>
                  <div className="space-y-1 text-sm text-slate-800">
                    {profilingSummary.largest_tables.slice(0, 10).map((t: any, idx: number) => (
                      <div
                        key={`${t.schema}.${t.table}.${idx}`}
                        className="flex justify-between border border-slate-100 rounded-lg px-2 py-1 bg-slate-50"
                      >
                        <span className="font-mono text-xs text-slate-800">
                          {t.schema}.{t.table}
                        </span>
                        <span className="text-xs text-slate-600">
                          {t.size_bytes_estimate ? formatBytes(t.size_bytes_estimate) : "—"}
                          {t.row_estimate ? ` • ${t.row_estimate.toLocaleString()} rows` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {profilingSummary.pii_hints?.length ? (
                <div>
                  <div className="text-xs uppercase text-slate-500 mb-1">PII hints</div>
                  <div className="space-y-1 text-sm text-slate-800">
                    {profilingSummary.pii_hints.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between border border-amber-100 bg-amber-50 rounded-lg px-2 py-1"
                      >
                        <span className="font-mono text-xs text-amber-900">
                          {p.schema}.{p.table}.{p.column}
                        </span>
                        <span className="text-xs text-amber-800">{p.reason || "PII-like"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <SetupGuidePanel />
          <SelectedTablesPanel
            selectedKeys={selectedKeys}
            onClear={() => {
              setSelectedTables([]);
              setTablesCount(0);
            }}
          />
          <Card className="p-4 border border-slate-200 shadow-sm bg-white">
            <div className="text-sm font-semibold text-slate-900">Connector</div>
            <div className="text-sm text-slate-700">
              {connector ? `${connector.name} (${connector.type})` : "Unknown"}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm text-slate-700">
      <span className="text-xs text-slate-500">{label}</span>
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border-slate-300"
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <label className="space-y-1 text-sm text-slate-700">
      <span className="text-xs text-slate-500">{label}</span>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxGrid({
  items,
  state,
  onToggle,
}: {
  items: { key: string; label: string }[];
  state: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {items.map((i) => (
        <label key={i.key} className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!state[i.key]} onChange={() => onToggle(i.key)} />
          {i.label}
        </label>
      ))}
    </div>
  );
}

function RadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.key}
            className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1"
          >
            <input type="radio" checked={value === o.key} onChange={() => onChange(o.key)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

function toggleMap(state: Record<string, boolean>, setState: (s: Record<string, boolean>) => void) {
  return (key: string) => {
    setState({ ...state, [key]: !state[key] });
  };
}

function mapToArray(m?: Record<string, boolean>) {
  if (!m) return [];
  return Object.entries(m)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

function arrayToMap(arr?: string[]) {
  const m: Record<string, boolean> = {};
  (arr || []).forEach((k) => (m[k] = true));
  return m;
}

function flattenDiscovered(discovered: Record<string, string[]>) {
  const out: { schema: string; table: string }[] = [];
  Object.entries(discovered).forEach(([s, tables]) => {
    tables.forEach((t) => out.push({ schema: s, table: t }));
  });
  return out;
}

function mergeConstraints(current: Record<string, any>, payload: Record<string, any>) {
  const merged = { ...(current || {}) };
  if (payload.selected_tables !== undefined) merged.selected_tables = payload.selected_tables;
  if (payload.data_checks) {
    merged.data_checks = {
      ...(current?.data_checks || {}),
      ...payload.data_checks,
      transformations: {
        ...(current?.data_checks?.transformations || {}),
        ...(payload.data_checks as any).transformations,
      },
      quality_checks: {
        ...(current?.data_checks?.quality_checks || {}),
        ...(payload.data_checks as any).quality_checks,
      },
      expected_volume: {
        ...(current?.data_checks?.expected_volume || {}),
        ...(payload.data_checks as any).expected_volume,
      },
      architecture: {
        ...(current?.data_checks?.architecture || {}),
        ...(payload.data_checks as any).architecture,
      },
    };
  }
  if (payload.profiling_summary) {
    merged.profiling_summary = payload.profiling_summary;
  }
  return merged;
}

function buildMockSummary(tables: { schema: string; table: string }[]) {
  const largest = tables.slice(0, 10).map((t, idx) => ({
    ...t,
    size_bytes_estimate: 1024 * 1024 * (idx + 1),
    row_estimate: 10000 * (idx + 1),
  }));
  return {
    table_count: tables.length,
    total_size_bytes_estimate: largest.reduce((a, b) => a + b.size_bytes_estimate, 0),
    largest_tables: largest,
    pii_hints: [],
    suggested_refresh: "daily",
    suggested_ingestion_mode: "batch",
    suggested_checks: [],
  };
}

function formatBytes(num: number) {
  if (!num) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = num;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}
