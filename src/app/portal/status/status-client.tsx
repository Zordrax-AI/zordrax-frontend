"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getRun,
  getRunEvents,
  getInfraOutputs,
  cancelRun,
  type RunEvent,
  type RunRow,
  type InfraOutputsResponse,
} from "@/lib/api";

type TerraformOutputs = Record<string, { value: unknown; sensitive?: boolean; type?: string }>;

function typedEntries(outputs: TerraformOutputs) {
  return Object.entries(outputs) as [string, TerraformOutputs[string]][];
}

export default function StatusClient() {
  const params = useSearchParams();
  const runIdParam = params.get("run");

  const runId = useMemo(() => runIdParam || "", [runIdParam]);

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [infra, setInfra] = useState<InfraOutputsResponse | null>(null);

  const [lastId, setLastId] = useState(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!runId) return;

    let alive = true;

    async function bootstrap() {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        const i = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(i);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load run");
      }
    }

    bootstrap();

    const timer = setInterval(async () => {
      try {
        const ev = await getRunEvents(runId, lastId);
        if (!alive) return;

        if (ev.length) {
          setEvents((prev) => [...prev, ...ev]);
          setLastId(ev[ev.length - 1].id);
        }

        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        const i = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(i);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Polling failed");
      }
    }, 2500);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [runId, lastId]);

  async function handleCancel() {
    if (!runId) return;
    try {
      await cancelRun(runId);
      alert("Cancel requested");
    } catch (e: any) {
      alert(e?.message ?? "Cancel failed");
    }
  }

  if (!runId) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Run Status</h1>
        <div className="text-sm opacity-80">
          Missing <code>?run=</code> query param.
        </div>
      </div>
    );
  }

  const outputs = (infra?.outputs || {}) as any as TerraformOutputs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="text-sm opacity-70 break-all">Run ID: {runId}</div>
          {run && (
            <div className="text-sm opacity-80">
              Status: <span className="font-mono">{run.status}</span> • Stage:{" "}
              <span className="font-mono">{run.stage}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleCancel}
          className="rounded-md border border-red-800 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30"
        >
          Cancel Run
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-200">
          {error}
        </div>
      )}

      {infra?.found && Object.keys(outputs).length > 0 ? (
        <TerraformOutputsTable outputs={outputs} />
      ) : (
        <div className="rounded-lg border border-slate-800 p-4 text-sm opacity-80">
          Terraform outputs not available yet.
        </div>
      )}

      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Event Timeline</h2>
        {events.length === 0 ? (
          <div className="text-sm opacity-70">No events yet.</div>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-md border border-white/10 bg-white/5 p-2">
                <div className="text-xs opacity-70">
                  [{e.level}] {e.stage} • {e.status} •{" "}
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="text-sm">{e.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TerraformOutputsTable({ outputs }: { outputs: TerraformOutputs }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Terraform Outputs</h2>

      <table className="w-full text-sm">
        <tbody>
          {typedEntries(outputs).map(([key, output]) => {
            const value = output?.value;
            return (
              <tr key={key} className="border-t border-slate-800">
                <td className="py-2 font-mono text-cyan-300">{key}</td>
                <td className="py-2 font-mono text-slate-300 break-all">
                  {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
