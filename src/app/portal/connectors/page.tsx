"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listConnectors, type Connector } from "@/lib/api";

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listConnectors();
      setConnectors(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load connectors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Connectors</h1>
          <p className="text-sm text-slate-400">Manage data sources used by onboarding.</p>
        </div>
        <Link href="/portal/connectors/add">
          <Button>Add connector</Button>
        </Link>
      </div>

      {error && <div className="text-sm text-red-300">{error}</div>}

      {!error && connectors.length === 0 && (
        <div className="text-sm text-slate-400">No connectors yet.</div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {connectors.map((c) => (
          <Card key={c.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="text-xs text-slate-400">{c.type}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200">
                {c.status || "unknown"}
              </span>
            </div>
            <div className="text-xs text-slate-500 break-all">{c.id}</div>
            <Link href={`/portal/connectors/${encodeURIComponent(c.id)}`} className="text-cyan-300 text-sm underline">
              View details
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
