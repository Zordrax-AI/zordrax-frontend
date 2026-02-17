"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { SummaryCards } from "@/components/SummaryCards";
import { profileTables } from "@/lib/api";
import { ProfilingSummary, TableInfo } from "@/lib/types";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run" },
];

export default function ProfilingPage() {
  const router = useRouter();
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [summary, setSummary] = useState<ProfilingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const cId = localStorage.getItem("za_connector_id");
    const saved = localStorage.getItem("za_selected_tables");
    if (!cId || !saved) {
      router.replace("/onboarding/tables");
      return;
    }
    setConnectorId(cId);
    setSelectedTables(JSON.parse(saved));
    const cachedSummary = localStorage.getItem("za_last_profiling_summary");
    if (cachedSummary) {
      setSummary(JSON.parse(cachedSummary));
    }
  }, [router]);

  const requestBody: TableInfo[] = useMemo(
    () =>
      selectedTables.map((id) => {
        const [schema, name] = id.includes(".") ? id.split(".") : [undefined, id];
        return { schema, name };
      }),
    [selectedTables]
  );

  const runProfile = async () => {
    if (!connectorId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await profileTables(connectorId, requestBody);
      setSummary(res);
      localStorage.setItem("za_last_profiling_summary", JSON.stringify(res));
      setMessage("Profiling complete");
    } catch (err: any) {
      setMessage(err.message || "Profiling failed");
    } finally {
      setLoading(false);
    }
  };

  const continueApproval = () => {
    router.push("/onboarding/approval");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <Stepper steps={STEPS} current="profiling" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profiling summary</h1>
          <p className="text-sm text-[color:var(--muted)]">Profile selected tables to produce an ingestion recommendation.</p>
        </div>
        <button
          onClick={runProfile}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Profiling..." : "Run profiling"}
        </button>
      </div>

      {summary ? (
        <SummaryCards summary={summary} />
      ) : (
        <div className="rounded-md border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
          No profiling results yet.
        </div>
      )}

      {message && <div className="text-sm text-[color:var(--muted)]">{message}</div>}

      <div className="flex justify-end">
        <button
          onClick={continueApproval}
          disabled={!summary}
          className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm disabled:opacity-50"
        >
          Continue to approval
        </button>
      </div>
    </div>
  );
}
