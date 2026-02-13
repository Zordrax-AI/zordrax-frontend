"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "./Logo";
import type { CatalogItem } from "./catalog";
import {
  createConnector,
  testConnector,
  discoverConnector,
  getConnector,
  brdSetConnector,
  brdUpsertConstraints,
} from "@/lib/api";

type Props = {
  requirementSetId: string;
  item: CatalogItem | null;
  onAttach: (connectorId: string) => Promise<void>;
  onClose: () => void;
  onError: (msg: string) => void;
  onCompleteNavigate?: (run?: boolean) => void;
};

export function CreateConnectorModal({
  requirementSetId,
  item,
  onAttach,
  onClose,
  onError,
  onCompleteNavigate,
}: Props) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testedOk, setTestedOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [schemaOpen, setSchemaOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const isDb = useMemo(() => item?.type === "postgres" || item?.type === "azure_sql", [item]);
  const isSheet = item?.type === "google_sheets";

  async function handleTest() {
    if (!item) return;
    setTesting(true);
    setMessage("");
    setTestedOk(false);
    try {
      const config = buildConfig();
      let id = draftId;
      if (!id) {
        const draft = await createConnector({
          name: item.name,
          type: item.type,
          config,
        });
        id = draft.id;
        setDraftId(draft.id);
      }
      await testConnector(id!, config);
      setTestedOk(true);
      setMessage("Connection looks good.");
    } catch (e: any) {
      setMessage(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setMessage("");
    try {
      const config = buildConfig();
      let id = draftId;
      if (!id) {
        const c = await createConnector({
          name: item.name,
          type: item.type,
          config,
        });
        id = c.id;
        setDraftId(c.id);
      }
      await testConnector(id!, config).catch(() => {});
      setTestedOk(true);
      const selectedTables = Object.entries(selected)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      await brdSetConnector(requirementSetId, id!);
      if (selectedTables.length > 0) {
        await brdUpsertConstraints(requirementSetId, { selected_tables: selectedTables });
      }
      await onAttach(id!);
      setMessage("Connected");
      onClose();
      onCompleteNavigate?.(true);
    } catch (e: any) {
      const msg = e?.message || "Save failed";
      onError(msg);
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscover() {
    if (!item || !draftId) return;
    setDiscovering(true);
    setMessage("");
    try {
      const config = buildConfig();
      await discoverConnector(draftId, config);
      const refreshed = await getConnector(draftId);
      const discovered = (refreshed as any)?.discovered_schema_json || {};
      setSchema(discovered);
      const openState: Record<string, boolean> = {};
      Object.keys(discovered || {}).forEach((s) => (openState[s] = true));
      setSchemaOpen(openState);
    } catch (e: any) {
      setMessage(e?.message || "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  }

  function toggleSchema(name: string, tables: string[]) {
    const nextOpen = { ...schemaOpen, [name]: !schemaOpen[name] };
    setSchemaOpen(nextOpen);
    const check = !schemaOpen[name];
    if (check) {
      const next = { ...selected };
      tables.forEach((t) => (next[`${name}.${t}`] = true));
      setSelected(next);
    }
  }

  function toggleTable(schemaName: string, table: string) {
    const key = `${schemaName}.${table}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const filteredSchemaEntries = useMemo<[string, string[]][]>(() => {
    if (!search) return Object.entries(schema);
    const q = search.toLowerCase();
    return Object.entries(schema).map(([s, tables]) => [
      s,
      tables.filter((t) => t.toLowerCase().includes(q) || s.toLowerCase().includes(q)),
    ]);
  }, [schema, search]);

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  function buildConfig() {
    if (isSheet) {
      if (!sheetUrl) throw new Error("Sheet URL required");
      return { sheet_url: sheetUrl };
    }
    if (isDb) {
      if (!host || !database) throw new Error("Host and database are required");
      return { host, port, database, user, password, ssl: true };
    }
    return {};
  }

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative space-y-5">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={onClose}>
          ✕
        </button>
        <div className="flex items-center gap-3">
          <Logo slug={item.logoSlug} alt={item.name} />
          <div>
            <div className="text-lg font-semibold text-slate-900">{item.name}</div>
            <div className="text-sm text-slate-500">We will test the connection before attaching it.</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isSheet && (
            <Field label="Sheet URL" placeholder="https://..." value={sheetUrl} onChange={setSheetUrl} />
          )}

          {isDb && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Host" placeholder="db.company.com" value={host} onChange={setHost} />
              <Field
                label="Port"
                type="number"
                placeholder={item.type === "azure_sql" ? "1433" : "5432"}
                value={port}
                onChange={(v) => setPort(Number(v) || 0)}
              />
              <Field label="Database" placeholder="sales" value={database} onChange={setDatabase} />
              <Field label="User" placeholder="readonly" value={user} onChange={setUser} />
              <Field label="Password" type="password" placeholder="••••••" value={password} onChange={setPassword} />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing || saving}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
          {testedOk && (
            <Button variant="outline" onClick={handleDiscover} disabled={discovering}>
              {discovering ? "Discovering…" : "Discover tables"}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
          {testedOk && <span className="text-sm text-emerald-600">Connection succeeded</span>}
          {message && <span className="text-sm text-slate-500">{message}</span>}
        </div>

        {Object.keys(schema).length > 0 && (
          <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Discovered tables</div>
                <div className="text-xs text-slate-500">{selectedCount} selected</div>
              </div>
              <Input
                className="w-56 bg-white"
                placeholder="Search tables"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-72 overflow-auto space-y-2">
              {filteredSchemaEntries.map(([schemaName, tables]) => (
                <details
                  key={schemaName}
                  open={schemaOpen[schemaName]}
                  onToggle={() => toggleSchema(schemaName, tables as string[])}
                  className="rounded-lg border border-slate-200 bg-white px-3"
                >
                  <summary className="flex items-center gap-2 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(tables as string[]).every((t) => selected[`${schemaName}.${t}`])}
                      onChange={() => toggleSchema(schemaName, tables as string[])}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold text-slate-800">{schemaName}</span>
                    <span className="text-xs text-slate-500">({tables.length})</span>
                  </summary>
                  <div className="pl-6 pb-3 space-y-1">
                    {(tables as string[]).map((t) => {
                      const key = `${schemaName}.${t}`;
                      return (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!selected[key]}
                            onChange={() => toggleTable(schemaName, t)}
                          />
                          <span className="font-mono text-xs text-slate-600">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500">{label}</div>
      <Input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white"
      />
    </div>
  );
}
