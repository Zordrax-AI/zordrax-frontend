"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getConnector, testConnector, discoverConnector, type Connector } from "@/lib/api";

type TabKey = "summary" | "logs" | "tables" | "actions";

export const dynamic = "force-dynamic";

export default function ConnectorDetailPage() {
  const params = useParams<{ connector_id: string }>();
  const connectorId = params?.connector_id;

  const [connector, setConnector] = useState<Connector | null>(null);
  const [tab, setTab] = useState<TabKey>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<"test" | "discover" | null>(null);
  const [discoverInfo, setDiscoverInfo] = useState<{ tables?: number } | null>(null);
  const [discoverResult, setDiscoverResult] = useState<any>(null);
  const [logs, setLogs] = useState<{ ts: string; action: "test" | "discover"; ok: boolean; message?: string }[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [tableMessage, setTableMessage] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [audit, setAudit] = useState<{ ts: string; user: string; action: string; detail?: string }[]>([]);

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && connectorId) {
      const key = `connector_logs:${connectorId}`;
      const existing = window.localStorage.getItem(key);
      if (existing) {
        try {
          setLogs(JSON.parse(existing));
        } catch {
          setLogs([]);
        }
      }
      const savedTables = window.localStorage.getItem(tablesKey(connectorId));
      if (savedTables) {
        try {
          setSelectedTables(new Set(JSON.parse(savedTables)));
        } catch {
          setSelectedTables(new Set());
        }
      } else {
        setSelectedTables(new Set());
      }

      const auditKey = auditKeyName(connectorId);
      const existingAudit = window.localStorage.getItem(auditKey);
      if (existingAudit) {
        try {
          setAudit(JSON.parse(existingAudit));
        } catch {
          setAudit([]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectorId]);

  async function load() {
    if (!connectorId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getConnector(connectorId);
      setConnector(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load connector");
    } finally {
      setLoading(false);
    }
  }

  const name = connector?.name || connectorId || "Connector";
  const type = connector?.type || "unknown";
  const status = connector?.status;
  const tables = extractTablesList(discoverResult);

  async function handleTest() {
    if (!connectorId) return;
    setActionLoading("test");
    setActionMessage(null);
    try {
      await testConnector(connectorId);
      const msg = "Connection test succeeded.";
      setActionMessage({ kind: "success", text: msg });
      const entry = { ts: new Date().toISOString(), action: "test" as const, ok: true };
      appendLog(connectorId, entry);
      setLogs((prev) => [entry, ...prev]);
      appendAudit(connectorId, { ts: new Date().toISOString(), user: "local", action: "test_connection", detail: "success" });
    } catch (e: any) {
      const msg = e?.message || "Connection test failed.";
      setActionMessage({ kind: "error", text: msg });
      const entry = { ts: new Date().toISOString(), action: "test" as const, ok: false, message: msg };
      appendLog(connectorId, entry);
      setLogs((prev) => [entry, ...prev]);
      appendAudit(connectorId, { ts: new Date().toISOString(), user: "local", action: "test_connection", detail: "fail" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDiscover() {
    if (!connectorId) return;
    setActionLoading("discover");
    setActionMessage(null);
    try {
      const result = await discoverConnector(connectorId);
      setDiscoverResult(result);
      const tables = extractTablesCount(result);
      setDiscoverInfo({ tables });
      const msg = tables ? `Discovery completed. Discovered ${tables} table${tables === 1 ? "" : "s"}.` : "Discovery completed.";
      setActionMessage({ kind: "success", text: msg });
      const entry = { ts: new Date().toISOString(), action: "discover" as const, ok: true, message: msg };
      appendLog(connectorId, entry);
      setLogs((prev) => [entry, ...prev]);
      appendAudit(connectorId, { ts: new Date().toISOString(), user: "local", action: "discover_tables", detail: "success" });
    } catch (e: any) {
      const msg = e?.message || "Discovery failed.";
      setActionMessage({ kind: "error", text: msg });
      const entry = { ts: new Date().toISOString(), action: "discover" as const, ok: false, message: msg };
      appendLog(connectorId, entry);
      setLogs((prev) => [entry, ...prev]);
      appendAudit(connectorId, { ts: new Date().toISOString(), user: "local", action: "discover_tables", detail: "fail" });
    } finally {
      setActionLoading(null);
    }
  }

  function handleToggleTable(id: string) {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSaveTables() {
    if (!connectorId) return;
    const arr = Array.from(selectedTables);
    window.localStorage.setItem(tablesKey(connectorId), JSON.stringify(arr));
    setTableMessage("Selection saved");
    appendAudit(connectorId, {
      ts: new Date().toISOString(),
      user: "local",
      action: "save_table_selection",
      detail: `selected ${arr.length}`,
    });
    setTimeout(() => setTableMessage(null), 2000);
  }

  function handleSelectAll(list: { id: string }[]) {
    setSelectedTables(new Set(list.map((t) => t.id)));
  }

  function handleClearSelection() {
    setSelectedTables(new Set());
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <div className="text-sm text-[color:var(--muted)]">Type: {type}</div>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="text-xs text-[color:var(--muted)] break-all">ID: {connectorId}</div>
      </header>

      {loading && (
        <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-3 text-sm text-[color:var(--muted)]">
          Loading connector…
        </div>
      )}

      {error && (
        <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      )}

      <Card className="p-4 space-y-4">
        <Tabs tab={tab} onChange={setTab} />

        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--fg)]">
          {tab === "summary" && (
            <SummaryTab
              onTest={handleTest}
              onDiscover={handleDiscover}
              actionMessage={actionMessage}
              actionLoading={actionLoading}
              discoverInfo={discoverInfo}
            />
          )}
          {tab === "logs" && <Placeholder title="Logs" body="Connector events will appear here" />}
          {tab === "tables" && (
            <ManageTablesTab
              tables={tables}
              selectedTables={selectedTables}
              onToggle={handleToggleTable}
              onSave={handleSaveTables}
              onSelectAll={handleSelectAll}
              onClear={handleClearSelection}
              message={tableMessage}
              search={tableSearch}
              onSearchChange={setTableSearch}
            />
          )}
          {tab === "actions" && <AuditTab audit={audit} />}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}

function Tabs({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "logs", label: "Logs" },
    { key: "tables", label: "Manage Tables" },
    { key: "actions", label: "User Actions" },
  ];
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {tabs.map((t) => {
        const active = t.key === tab;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`rounded-md px-3 py-2 border text-[color:var(--fg)] transition ${
              active
                ? "border-[color:var(--accent)] bg-[color:var(--accent-bg,rgba(59,130,246,0.12))] text-[color:var(--accent)]"
                : "border-[color:var(--border)] bg-[color:var(--card-2)] hover:border-[color:var(--accent)]"
            }`}
            type="button"
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>
      <p className="text-sm text-[color:var(--muted)]">{body}</p>
    </div>
  );
}

function SummaryTab({
  onTest,
  onDiscover,
  actionMessage,
  actionLoading,
  discoverInfo,
}: {
  onTest: () => void;
  onDiscover: () => void;
  actionMessage: { kind: "success" | "error"; text: string } | null;
  actionLoading: "test" | "discover" | null;
  discoverInfo: { tables?: number } | null;
}) {
  return (
    <div className="space-y-4">
      {actionMessage && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            actionMessage.kind === "success"
              ? "border-[color:var(--success)] text-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))]"
              : "border-[color:var(--danger)] text-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))]"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onTest} disabled={actionLoading === "test"}>
          {actionLoading === "test" ? "Testing..." : "Test Connection"}
        </Button>
        <Button variant="outline" onClick={onDiscover} disabled={actionLoading === "discover"}>
          {actionLoading === "discover" ? "Discovering..." : "Discover Tables"}
        </Button>
      </div>

      {discoverInfo?.tables !== undefined && (
        <div className="text-xs text-[color:var(--muted)]">
          Discovered {discoverInfo.tables} {discoverInfo.tables === 1 ? "table" : "tables"}.
        </div>
      )}

      <Placeholder title="Summary" body="Test connection and discover tables" />
    </div>
  );
}

function ManageTablesTab({
  tables,
  selectedTables,
  onToggle,
  onSave,
  onSelectAll,
  onClear,
  message,
  search,
  onSearchChange,
}: {
  tables: { id: string; table: string; schema?: string }[];
  selectedTables: Set<string>;
  onToggle: (id: string) => void;
  onSave: () => void;
  onSelectAll: (list: { id: string }[]) => void;
  onClear: () => void;
  message: string | null;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const filtered = tables.filter((t) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      t.table.toLowerCase().includes(term) ||
      (t.schema || "").toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term)
    );
  });

  if (!tables.length) {
    return (
      <div className="rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)]">
        No discovery results. Run ‘Discover Tables’ in Summary to load tables.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
          <span>Total: {tables.length}</span>
          <span>Selected: {selectedTables.size}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onSelectAll(filtered)}>
            Select all
          </Button>
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search tables"
        className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      />

      <div className="space-y-2 max-h-96 overflow-auto pr-1">
        {filtered.map((t) => {
          const checked = selectedTables.has(t.id);
          return (
            <label
              key={t.id}
              className="flex items-start gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={checked}
                onChange={() => onToggle(t.id)}
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

      {message && (
        <div className="rounded-md border border-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))] px-3 py-2 text-xs text-[color:var(--success)]">
          {message}
        </div>
      )}

      <Button variant="primary" onClick={onSave}>
        Save Selection
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: Connector["status"] }) {
  const norm = normalizeStatus(status);
  const tone =
    norm === "connected" ? "success" : norm === "failed" ? "danger" : "default";
  const label =
    norm === "connected" ? "Connected" : norm === "failed" ? "Failed" : "Unknown";
  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border";
  const toneClass =
    tone === "success"
      ? "border-[color:var(--success)] text-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))]"
      : tone === "danger"
      ? "border-[color:var(--danger)] text-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))]"
      : "border-[color:var(--border)] text-[color:var(--muted)] bg-[color:var(--card-2)]";
  return (
    <span className={`${base} ${toneClass}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function normalizeStatus(status: Connector["status"]) {
  const s = String(status || "").toLowerCase();
  if (s.includes("ok") || s.includes("ready") || s.includes("connected")) return "connected";
  if (s.includes("err") || s.includes("fail")) return "failed";
  return "unknown";
}

function appendLog(
  connectorId: string | undefined,
  entry: { ts: string; action: "test" | "discover"; ok: boolean; message?: string }
) {
  if (typeof window === "undefined" || !connectorId) return;
  try {
    const key = `connector_logs:${connectorId}`;
    const existing = window.localStorage.getItem(key);
    const parsed = existing ? (JSON.parse(existing) as any[]) : [];
    parsed.unshift(entry);
    window.localStorage.setItem(key, JSON.stringify(parsed.slice(0, 200)));
  } catch {
    // ignore storage errors
  }
}

function extractTablesCount(result: any): number {
  if (!result || typeof result !== "object") return 0;
  if (Array.isArray((result as any).tables)) return (result as any).tables.length;
  if (result.discovered_schema_json && typeof result.discovered_schema_json === "object") {
    return Object.keys(result.discovered_schema_json).length;
  }
  return 0;
}

function tablesKey(id: string) {
  return `connector_tables_selected:${id}`;
}

function extractTablesList(result: any): { id: string; table: string; schema?: string }[] {
  if (!result) return [];
  if (Array.isArray(result.tables)) {
    return result.tables.map((t: any) => {
      const str = String(t);
      const [schema, table] = str.includes(".") ? str.split(".") : [undefined, str];
      return { id: str, table: table || str, schema };
    });
  }
  if (result.discovered_schema_json && typeof result.discovered_schema_json === "object") {
    return Object.keys(result.discovered_schema_json).map((k: string) => {
      const [schema, table] = k.includes(".") ? k.split(".") : [undefined, k];
      return { id: k, table: table || k, schema };
    });
  }
  return [];
}

function appendAudit(connectorId: string | undefined, entry: { ts: string; user: string; action: string; detail?: string }) {
  if (typeof window === "undefined" || !connectorId) return;
  try {
    const key = auditKeyName(connectorId);
    const existing = window.localStorage.getItem(key);
    const parsed = existing ? (JSON.parse(existing) as any[]) : [];
    parsed.unshift(entry);
    window.localStorage.setItem(key, JSON.stringify(parsed.slice(0, 200)));
  } catch {
    // ignore storage errors
  }
}

function auditKeyName(id: string) {
  return `connector_audit:${id}`;
}

function AuditTab({
  audit,
}: {
  audit: { ts: string; user: string; action: string; detail?: string }[];
}) {
  if (!audit.length) {
    return (
      <div className="rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)]">
        No actions recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-[color:var(--muted)]">
          <tr className="border-b border-[color:var(--border)]">
            <th className="py-2 text-left">Time</th>
            <th className="py-2 text-left">User</th>
            <th className="py-2 text-left">Action</th>
            <th className="py-2 text-left">Detail</th>
          </tr>
        </thead>
        <tbody>
          {audit.map((item) => (
            <tr key={`${item.ts}-${item.action}`} className="border-b border-[color:var(--border)]">
              <td className="py-2 text-[color:var(--muted)]">{new Date(item.ts).toLocaleString()}</td>
              <td className="py-2">{item.user}</td>
              <td className="py-2">{item.action}</td>
              <td className="py-2 text-[color:var(--muted)]">{item.detail || "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
