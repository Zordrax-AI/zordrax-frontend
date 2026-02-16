"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getConnector, testConnector, discoverConnector, type Connector } from "@/lib/api";

type TabKey = "summary" | "logs" | "tables" | "actions";
type ActionMessage = { kind: "success" | "error"; text: string } | null;

export const dynamic = "force-dynamic";

export default function ConnectorDetailPage() {
  const params = useParams<{ id: string }>();
  const connectorId = params?.id;

  const [connector, setConnector] = useState<Connector | null>(null);
  const [tab, setTab] = useState<TabKey>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<"test" | "discover" | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && connectorId) {
      const stored = localStorage.getItem(logKey(connectorId));
      if (stored) {
        try {
          setLogs(JSON.parse(stored));
        } catch {
          setLogs([]);
        }
      }
      const storedTables = localStorage.getItem(tablesKey(connectorId));
      if (storedTables) {
        try {
          setSelectedTables(new Set(JSON.parse(storedTables)));
        } catch {
          setSelectedTables(new Set());
        }
      } else {
        setSelectedTables(new Set());
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
      setTables(extractTablesFromConnector(data));
    } catch (e: any) {
      setError(e?.message || "Failed to load connector");
    } finally {
      setLoading(false);
    }
  }

  const name = connector?.name || connectorId || "Connector";
  const type = connector?.type || "unknown";
  const status = connector?.status;

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
              actionMessage={actionMessage}
              actionLoading={actionLoading}
              onTest={handleTest}
              onDiscover={handleDiscover}
              logs={logs}
            />
          )}
          {tab === "logs" && <Placeholder title="Logs" />}
          {tab === "tables" && (
            <TablesTab
              tables={tables}
              selectedTables={selectedTables}
              onToggle={handleToggleTable}
              onSave={handleSaveTables}
            />
          )}
          {tab === "actions" && <Placeholder title="User Actions" />}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );

  async function handleTest() {
    if (!connectorId) return;
    setActionLoading("test");
    try {
      await testConnector(connectorId);
      const msg = "Connection test succeeded.";
      setActionMessage({ kind: "success", text: msg });
      appendLog(`TEST OK - ${new Date().toISOString()}`);
    } catch (e: any) {
      const msg = e?.message || "Connection test failed.";
      setActionMessage({ kind: "error", text: msg });
      appendLog(`TEST FAIL - ${new Date().toISOString()} - ${msg}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDiscover() {
    if (!connectorId) return;
    setActionLoading("discover");
    try {
      const result = await discoverConnector(connectorId);
      const discovered = extractTablesFromDiscovery(result);
      if (discovered.length > 0) setTables(discovered);
      const msg = discovered.length ? "Discovery completed." : "Discovery started.";
      setActionMessage({ kind: "success", text: msg });
      appendLog(`DISCOVER OK - ${new Date().toISOString()}`);
    } catch (e: any) {
      const msg = e?.message || "Discovery failed.";
      setActionMessage({ kind: "error", text: msg });
      appendLog(`DISCOVER FAIL - ${new Date().toISOString()} - ${msg}`);
    } finally {
      setActionLoading(null);
    }
  }

  function appendLog(entry: string) {
    setLogs((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      if (typeof window !== "undefined" && connectorId) {
        localStorage.setItem(logKey(connectorId), JSON.stringify(next));
      }
      return next;
    });
  }

  function handleToggleTable(table: string) {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table)) next.delete(table);
      else next.add(table);
      return next;
    });
  }

  function handleSaveTables() {
    if (!connectorId) return;
    const arr = Array.from(selectedTables);
    localStorage.setItem(tablesKey(connectorId), JSON.stringify(arr));
    setActionMessage({ kind: "success", text: "Selection saved." });
  }
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

function SummaryTab({
  actionMessage,
  actionLoading,
  onTest,
  onDiscover,
  logs,
}: {
  actionMessage: ActionMessage;
  actionLoading: "test" | "discover" | null;
  onTest: () => void;
  onDiscover: () => void;
  logs: string[];
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

      <div className="space-y-2">
        <div className="text-xs font-semibold text-[color:var(--muted)]">Recent actions</div>
        {logs.length === 0 && <div className="text-xs text-[color:var(--muted)]">No recent actions.</div>}
        {logs.length > 0 && (
          <ul className="space-y-1 text-xs text-[color:var(--muted)]">
            {logs.map((entry, idx) => (
              <li key={idx} className="rounded bg-[color:var(--card)] px-2 py-1">
                {entry}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TablesTab({
  tables,
  selectedTables,
  onToggle,
  onSave,
}: {
  tables: string[];
  selectedTables: Set<string>;
  onToggle: (table: string) => void;
  onSave: () => void;
}) {
  const hasTables = tables.length > 0;
  return (
    <div className="space-y-4">
      {!hasTables && (
        <div className="rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)]">
          Run Discover to list tables.
        </div>
      )}

      {hasTables && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[color:var(--muted)]">Select tables</div>
          <div className="space-y-2">
            {tables.map((t) => {
              const checked = selectedTables.has(t);
              return (
                <label
                  key={t}
                  className="flex items-start gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={checked}
                    onChange={() => onToggle(t)}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[color:var(--fg)]">{t}</span>
                    <span className="text-xs text-[color:var(--muted)]">
                      PK: -  Timestamp: -  PII: -
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <Button variant="primary" onClick={onSave}>
            Save Selection
          </Button>
        </div>
      )}
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>
      <p className="text-sm text-[color:var(--muted)]">Content coming soon.</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Connector["status"] }) {
  const norm = normalizeStatus(status);
  const tone =
    norm === "connected" ? "success" : norm === "error" ? "danger" : "default";
  const label =
    norm === "connected" ? "Connected" : norm === "error" ? "Error" : "Unknown";
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
  if (s.includes("err") || s.includes("fail")) return "error";
  return "unknown";
}

function logKey(id: string) {
  return `connector_logs:${id}`;
}

function tablesKey(id: string) {
  return `connector_tables_selected:${id}`;
}

function extractTablesFromConnector(connector?: Connector | null): string[] {
  const schema = (connector as any)?.discovered_schema_json;
  if (schema && typeof schema === "object") {
    return Object.keys(schema);
  }
  return [];
}

function extractTablesFromDiscovery(result: any): string[] {
  if (!result || typeof result !== "object") return [];
  if (Array.isArray((result as any).tables)) return (result as any).tables as string[];
  if (result.discovered_schema_json && typeof result.discovered_schema_json === "object") {
    return Object.keys(result.discovered_schema_json);
  }
  return [];
}
