"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { discoverConnector, getConnector, testConnector, type Connector } from "@/lib/api";

type DbConfig = {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
};

export default function ConnectorDetailPage() {
  const params = useParams<{ id: string }>();
  const connectorId = useMemo(() => params?.id ?? "", [params]);

  const [connector, setConnector] = useState<Connector | null>(null);
  const [config, setConfig] = useState<DbConfig>({});
  const [testResult, setTestResult] = useState<string>("");
  const [discoverResult, setDiscoverResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!connectorId) return;
    (async () => {
      try {
        const c = await getConnector(connectorId);
        setConnector(c);
        if (c?.config && typeof c.config === "object") setConfig(c.config as DbConfig);
      } catch (e: any) {
        setError(e?.message || "Failed to load connector");
      }
    })();
  }, [connectorId]);

  async function handleTest() {
    if (!connectorId) return;
    setBusy(true);
    setError("");
    setTestResult("");
    try {
      const r = await testConnector(connectorId, config as any);
      setTestResult(r?.status || "ok");
    } catch (e: any) {
      setError(e?.message || "Test failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscover() {
    if (!connectorId) return;
    setBusy(true);
    setError("");
    setDiscoverResult(null);
    try {
      const r = await discoverConnector(connectorId, config as any);
      setDiscoverResult(r?.schema || r);
    } catch (e: any) {
      setError(e?.message || "Discover failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Connector</h1>
        <div className="text-sm text-slate-400 break-all">{connectorId}</div>
        {connector?.status && <div className="text-xs text-slate-300 mt-1">Status: {connector.status}</div>}
      </div>

      {error && <div className="text-sm text-red-300">{error}</div>}

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Host" value={config.host} onChange={(v) => setConfig({ ...config, host: v })} />
          <Field
            label="Port"
            type="number"
            value={config.port}
            onChange={(v) => setConfig({ ...config, port: Number(v) })}
          />
          <Field label="Database" value={config.database} onChange={(v) => setConfig({ ...config, database: v })} />
          <Field label="User" value={config.user} onChange={(v) => setConfig({ ...config, user: v })} />
          <Field
            label="Password"
            type="password"
            value={config.password}
            onChange={(v) => setConfig({ ...config, password: v })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={!!config.ssl}
              onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
            />
            SSL
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTest} disabled={busy}>
            {busy ? "Testing…" : "Test connection"}
          </Button>
          <Button variant="outline" onClick={handleDiscover} disabled={busy}>
            Discover schema
          </Button>
          {testResult && <div className="text-sm text-slate-300">Test: {testResult}</div>}
        </div>
      </Card>

      {discoverResult ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">Discovered schema</div>
          <pre className="text-xs text-slate-200 overflow-auto">{JSON.stringify(discoverResult, null, 2)}</pre>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
