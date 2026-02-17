"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  brdReadRequirementSet,
  getConnector,
  discoverConnector,
  getConstraints,
  updateConstraints,
  type Connector,
} from "@/lib/api";
import { SchemaSidebar } from "@/components/connectors/SchemaSidebar";
import { TablePicker, keyFor } from "@/components/connectors/TablePicker";
import { SelectedTablesPanel } from "@/components/connectors/SelectedTablesPanel";
import { getRequirementSetId, wizardHref } from "@/lib/wizard";

export default function TablesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const requirementSetId = getRequirementSetId(sp) ?? "";

  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [schemas, setSchemas] = useState<Record<string, string[]>>({});
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [schemaSearch, setSchemaSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(false);
  const [constraintsCache, setConstraintsCache] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!requirementSetId) return;
    (async () => {
      try {
        const rs = await brdReadRequirementSet(requirementSetId);
        const cid = (rs as any)?.connector_snapshot_json?.id || rs.connector_id || null;
        setConnectorId(cid);
        if (cid) await loadConnector(cid);
        await hydrateConstraints();
      } catch (e: any) {
        setError(e?.message || "Failed to load requirement set");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementSetId]);

  async function hydrateConstraints() {
    try {
      const c = await getConstraints(requirementSetId);
      const cj = (c as any)?.constraints_json || c || {};
      setConstraintsCache(cj);
      const sel =
        cj.selected_tables?.tables ||
        cj.selected_tables ||
        (cj.data_checks?.selected_tables as any) ||
        [];
      const map: Record<string, boolean> = {};
      (sel || []).forEach((t: any) => {
        if (t?.schema && t?.table) map[`${t.schema}.${t.table}`] = true;
      });
      setSelected(map);
    } catch {
      /* ignore */
    }
  }

  async function loadConnector(id: string) {
    setLoading(true);
    setError("");
    try {
      const conn = await getConnector(id);
      setConnector(conn);
      const discovered = (conn as any)?.discovered_schema_json;
      if (discovered && Object.keys(discovered).length) {
        setSchemas(discovered);
        setSelectedSchema(Object.keys(discovered)[0] || null);
      } else {
        // lazy discover if none cached
        try {
          await discoverConnector(id);
          const refreshed = await getConnector(id);
          const d2 = (refreshed as any)?.discovered_schema_json || {};
          setConnector(refreshed);
          if (Object.keys(d2).length) {
            setSchemas(d2);
            setSelectedSchema(Object.keys(d2)[0] || null);
          }
        } catch {
          /* ignore */
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load connector");
    } finally {
      setLoading(false);
    }
  }

  async function onDiscover() {
    if (!connectorId) return;
    setLoading(true);
    setError("");
    try {
      await discoverConnector(connectorId);
      await loadConnector(connectorId);
    } catch (e: any) {
      setError(e?.message || "Discovery failed");
    } finally {
      setLoading(false);
    }
  }

  const filteredTables = useMemo(() => {
    if (!selectedSchema) return [];
    const names = schemas[selectedSchema] || [];
    const needle = search.toLowerCase();
    return names
      .filter((n) => n.toLowerCase().includes(needle))
      .map((n) => ({ schema: selectedSchema, table: n }));
  }, [schemas, selectedSchema, search]);

  function toggleTable(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    setSkip(false);
  }

  function toggleAll() {
    const next = { ...selected };
    const allSelected = filteredTables.every((t) => next[keyFor(t)]);
    filteredTables.forEach((t) => (next[keyFor(t)] = !allSelected));
    setSelected(next);
    setSkip(false);
  }

  const selectedKeys = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  async function saveAndContinue() {
    if (!requirementSetId) return;
    setSaving(true);
    setError("");
    try {
      const selectedTables = selectedKeys.map((k) => {
        const [schema, table] = k.split(".");
        return { schema, table };
      });
      const merged = mergeConstraints(constraintsCache, {
        selected_tables: selectedTables,
      });
      await updateConstraints(requirementSetId, merged);
      router.push(wizardHref("data-checks", requirementSetId));
    } catch (e: any) {
      setError(e?.message || "Failed to save selection");
    } finally {
      setSaving(false);
    }
  }

  if (!connectorId) {
    return (
      <div className="flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-3 max-w-md text-center">
          <div className="text-lg font-semibold">No connector attached</div>
          <div className="text-sm text-slate-600">
            Attach a connector first on the Connect Data step to pick tables.
          </div>
          <Button onClick={() => router.push(wizardHref("connect-data", requirementSetId || undefined))}>
            Go to Connect Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm uppercase text-slate-500 font-semibold">Select Tables</div>
          <div className="text-2xl font-semibold text-slate-900">Choose tables to include</div>
          {connector && (
            <div className="text-sm text-slate-600 mt-1">
              {connector.name} · {connector.type} · status {connector.status}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDiscover} disabled={loading}>
            {loading ? "Discovering..." : "Discover tables"}
          </Button>
          <Button onClick={saveAndContinue} disabled={saving || (!skip && selectedKeys.length === 0)}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-700">{selectedKeys.length} tables selected</div>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables"
              className="w-56 bg-white border-slate-300"
            />
            <Button variant="ghost" onClick={() => setSkip(true)}>
              Skip (select later)
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900 mb-2">Schemas</div>
            <SchemaSidebar
              schemas={schemas}
              selectedSchema={selectedSchema}
              onSelectSchema={setSelectedSchema}
              search={schemaSearch}
              onSearch={setSchemaSearch}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <TablePicker tables={filteredTables} selected={selected} onToggle={(k) => toggleTable(k)} onToggleAll={toggleAll} />
          </div>

          <SelectedTablesPanel
            selectedKeys={selectedKeys}
            onClear={() => {
              setSelected({});
              setSkip(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function mergeConstraints(current: Record<string, any>, payload: Record<string, any>) {
  const merged = { ...(current || {}) };
  if (payload.selected_tables) {
    merged.selected_tables = payload.selected_tables;
  }
  return merged;
}
