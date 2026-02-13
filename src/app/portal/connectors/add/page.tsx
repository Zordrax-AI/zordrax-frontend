"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createConnector } from "@/lib/api";

type DbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
};

export default function AddConnectorPage() {
  const router = useRouter();

  const [name, setName] = useState("Azure SQL");
  const [type, setType] = useState<"azure-sql" | "postgres">("azure-sql");
  const [config, setConfig] = useState<DbConfig>({
    host: "",
    port: 1433,
    database: "",
    user: "",
    password: "",
    ssl: true,
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    setError("");
    try {
      const res = await createConnector({
        name,
        type,
        config: config as any,
      });
      if (res?.id) router.push(`/portal/connectors/${res.id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create connector");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Add Connector</h1>
        <p className="text-sm text-slate-400">Only Azure SQL and Postgres are enabled right now.</p>
      </div>

      {error && <div className="text-sm text-red-300">{error}</div>}

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Type</div>
            <select
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="azure-sql">Azure SQL</option>
              <option value="postgres">Postgres</option>
              <option disabled>Salesforce (coming soon)</option>
              <option disabled>Google Sheets (coming soon)</option>
              <option disabled>HubSpot (coming soon)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Host</div>
            <Input value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Port</div>
            <Input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Database</div>
            <Input value={config.database} onChange={(e) => setConfig({ ...config, database: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">User</div>
            <Input value={config.user} onChange={(e) => setConfig({ ...config, user: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Password</div>
            <Input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={config.ssl}
              onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
            />
            SSL
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? "Creating…" : "Create Connector"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
