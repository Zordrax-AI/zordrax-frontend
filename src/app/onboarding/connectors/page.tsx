"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { StatusPill } from "@/components/StatusPill";
import { Connector } from "@/lib/types";
import { listConnectors, createConnector, testConnector } from "@/lib/api";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run" },
];

export default function ConnectorsPage() {
  const router = useRouter();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "postgres",
    name: "Primary connector",
    host: "",
    database: "",
    schema: "",
    user: "",
    password: "",
  });
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("za_connector_id");
    if (existing) setConnectorId(existing);
    setLoading(true);
    listConnectors()
      .then(setConnectors)
      .catch((err) => setMessage(err.message || "Failed to load connectors"))
      .finally(() => setLoading(false));
  }, []);

  const saveConnector = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const payload = { ...form };
      const created = await createConnector(payload);
      setConnectorId(created.id);
      localStorage.setItem("za_connector_id", created.id);
      setConnectors((prev) => [created, ...prev]);
      setMessage(`Saved connector ${created.name || created.id}`);
      router.push("/onboarding/tables");
    } catch (err: any) {
      setMessage(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    if (!connectorId) {
      setMessage("Save connector first");
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      const res = await testConnector(connectorId);
      setMessage(res.ok ? "Connection ok" : res.message || "Connection failed");
    } catch (err: any) {
      setMessage(err.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <Stepper steps={STEPS} current="connectors" />

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5">
          <h2 className="text-xl font-semibold">Add connector</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              >
                <option value="azure_sql">Azure SQL</option>
                <option value="snowflake">Snowflake</option>
                <option value="postgres">Postgres</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Host / Account</span>
              <input
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Database</span>
              <input
                value={form.database}
                onChange={(e) => setForm({ ...form, database: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Schema</span>
              <input
                value={form.schema}
                onChange={(e) => setForm({ ...form, schema: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">User</span>
              <input
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Password / Token</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runTest}
              className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm disabled:opacity-50"
              disabled={testing}
            >
              {testing ? "Testing..." : "Test connection"}
            </button>
            <button
              onClick={saveConnector}
              className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </div>
          {message && <div className="text-sm text-[color:var(--muted)]">{message}</div>}
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 space-y-3">
            <h3 className="font-semibold">Existing connectors</h3>
            {loading && connectors.length === 0 && <div className="text-sm text-[color:var(--muted)]">Loading...</div>}
            {connectors.length === 0 && !loading && <div className="text-sm text-[color:var(--muted)]">None yet.</div>}
            <ul className="space-y-2">
              {connectors.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-md border border-[color:var(--border)] px-3 py-2">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {c.type} {c.host ? `• ${c.host}` : ""}
                    </div>
                  </div>
                  {c.status && <StatusPill status={c.status} />}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-4 text-sm text-[color:var(--muted)]">
            Coming soon: BigQuery, Oracle, Salesforce connectors.
          </div>
        </div>
      </div>
    </div>
  );
}
