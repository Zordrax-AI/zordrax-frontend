"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SchemaSidebar } from "@/components/connectors/SchemaSidebar";
import { TablePicker, keyFor } from "@/components/connectors/TablePicker";
import { SelectedTablesPanel } from "@/components/connectors/SelectedTablesPanel";
import {
  brdReadRequirementSet,
  brdUpsertConstraints,
  discoverConnector,
  getConnector,
  updateConstraints,
  type Connector,
} from "@/lib/api";

function mockSchema() {
  return {
    public: ["customers", "orders", "payments", "products", "line_items"],
    analytics: ["events", "pageviews", "sessions"],
  };
}

export default function SelectTablesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<Record<string, string[]>>({});
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");

  useEffect(() => {
    if (!requirementSetId) return;
    (async () => {
      try {
        const rs = await brdReadRequirementSet(requirementSetId);
        if (rs.connector_id) setConnectorId(rs.connector_id);
        else setConnectorId(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load requirement set");
      }
    })();
  }, [requirementSetId]);

  async function handleDiscover() {
    if (!connectorId) return;
    setLoading(true);
    setError("");
    try {
      await discoverConnector(connectorId);
      const c = await getConnector(connectorId);
      const discovered = (c as any)?.discovered_schema_json;
      const payload = discovered && Object.keys(discovered).length ? discovered : mockSchema();
      setSchemas(payload);
      const first = Object.keys(payload)[0] || null;
      setSelectedSchema(first);
    } catch (e: any) {
      setError(e?.message || "Discovery failed; showing sample tables.");
      const payload = mockSchema();
      setSchemas(payload);
      setSelectedSchema(Object.keys(payload)[0] || null);
    } finally {
      setLoading(false);
    }
  }

  const tables = useMemo(() => {
    if (!selectedSchema) return [];
    const t = schemas[selectedSchema] || [];
    return t.map((name) => ({ schema: selectedSchema, table: name }));
  }, [schemas, selectedSchema]);

  function toggleTable(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAll() {
    const next = { ...selected };
    const allSelected = tables.every((t) => next[keyFor(t)]);
    tables.forEach((t) => (next[keyFor(t)] = !allSelected));
    setSelected(next);
  }

  async function handleSave() {
    if (!requirementSetId) return;
    const selectedTables = Object.entries(selected)
      .filter(([_, v]) => v)
      .map(([k]) => {
        const [schema, table] = k.split(".");
        return { schema, table };
      });
    try {
      await updateConstraints(requirementSetId, { selected_tables: selectedTables });
      router.push(
        `/portal/onboarding/mozart/data-checks?requirement_set_id=${encodeURIComponent(requirementSetId)}`
      );
    } catch (e: any) {
      setError(e?.message || "Failed to save selection");
    }
  }

  if (!connectorId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <Card className="p-6 space-y-3 border border-slate-200 shadow-sm bg-white">
          <div className="text-lg font-semibold">No connector attached</div>
          <div className="text-sm text-slate-600">Attach a connector first on the Connect Data step.</div>
          <Button onClick={() => router.push(`/portal/onboarding/mozart/connect-data?requirement_set_id=${requirementSetId}`)}>
            Go to Connect Data
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm uppercase text-slate-500 font-semibold">Select Tables</div>
            <div className="text-2xl font-semibold text-slate-900">Choose tables to include</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscover} disabled={loading}>
              {loading ? "Discovering…" : "Discover tables"}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              Save & Continue
            </Button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4">
          <Card className="p-4 border border-slate-200 shadow-sm bg-white">
            <div className="text-sm font-semibold text-slate-900 mb-3">Connected Schemas</div>
            <SchemaSidebar
              schemas={schemas}
              selectedSchema={selectedSchema}
              onSelectSchema={setSelectedSchema}
              search={sidebarSearch}
              onSearch={setSidebarSearch}
            />
          </Card>

          <div className="space-y-3">
            <TablePicker
              tables={tables}
              selected={selected}
              onToggle={(k) => toggleTable(k)}
              onToggleAll={toggleAll}
            />
          </div>

          <SelectedTablesPanel
            selectedKeys={Object.entries(selected)
              .filter(([, v]) => v)
              .map(([k]) => k)}
            onClear={() => setSelected({})}
          />
        </div>
      </div>
    </div>
  );
}
