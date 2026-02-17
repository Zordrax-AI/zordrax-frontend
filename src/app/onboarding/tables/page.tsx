"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { TableSelector } from "@/components/TableSelector";
import { discoverTables } from "@/lib/api";
import { TableInfo } from "@/lib/types";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run" },
];

export default function TablesPage() {
  const router = useRouter();
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const cId = localStorage.getItem("za_connector_id");
    if (!cId) {
      router.replace("/onboarding/connectors");
      return;
    }
    setConnectorId(cId);
    const saved = localStorage.getItem("za_selected_tables");
    if (saved) {
      setSelected(JSON.parse(saved));
    }
  }, [router]);

  const discover = async () => {
    if (!connectorId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await discoverTables(connectorId);
      setTables(res.tables || []);
      setMessage(`Discovered ${res.tables?.length || 0} tables`);
    } catch (err: any) {
      setMessage(err.message || "Discovery failed");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    localStorage.setItem("za_selected_tables", JSON.stringify(selected));
    router.push("/onboarding/profiling");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <Stepper steps={STEPS} current="tables" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Select tables</h1>
          <p className="text-sm text-[color:var(--muted)]">Discover from your connector, pick what to include.</p>
        </div>
        <button onClick={discover} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50" disabled={loading}>
          {loading ? "Discovering..." : "Discover tables"}
        </button>
      </div>

      <TableSelector tables={tables} selected={selected} onChange={setSelected} />

      {message && <div className="text-sm text-[color:var(--muted)]">{message}</div>}

      <div className="flex justify-end">
        <button
          onClick={next}
          disabled={selected.length === 0}
          className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Next ({selected.length})
        </button>
      </div>
    </div>
  );
}
