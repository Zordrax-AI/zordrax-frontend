"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getRun,
  getRunEvents,
  cancelRun,
  getInfraOutputs,
  type RunEvent,
  type RunRow,
  type InfraOutputsResponse,
} from "@/lib/api";

/* =========================================================
   Runtime Terraform output types (INTENTIONALLY LOCAL)
========================================================= */

type TerraformOutputValue = {
  value?: unknown;
  type?: string;
  sensitive?: boolean;
};

type TerraformOutputs = Record<string, TerraformOutputValue>;

function typedEntries(outputs: TerraformOutputs): [string, TerraformOutputValue][] {
  return Object.entries(outputs);
}

/* =========================================================
   Component
========================================================= */

export default function StatusClient() {
  const params = useSearchParams();

  // runId can be null -> normalize to "" so we can guard cleanly
  const runId = useMemo(() => params.get("run") ?? "", [params]);

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState(0);

  const [outputs, setOutputs] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    let alive = true;
    setError(null);
    setRun(null);
    setEvents([]);
    setLastId(0);
    setOutputs(null);

    async function bootstrap() {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        // try outputs immediately (may be not found at start)
        try {
          const o = await getInfraOutputs(runId);
          if (!alive) return;
          setOutputs(o);
        } catch {
          // ignore if not available yet
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load run");
      }
    }

    bootstrap();

    const timer = setInterval(async () => {
      if (!alive) return;

      try {
        const ev = await getRunEvents(runId, lastId);
        if (!alive) return;

        if (ev.length) {
          setEvents((prev) => [...prev, ...ev]);
          setLastId(ev[ev.length - 1].id);
        }

        // refresh run + outputs periodically so UI updates when callback lands
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        try {
          const o = await getInfraOutputs(runId);
          if (!alive) return;
          setOutputs(o);
        } catch {
          // ignore
        }
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
    await cancelRun(runId);
    alert("Cancel requested");
  }

  if (!runId) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Run Status</h1>
        <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
          Missing <span className="font-mono">?run=</span> parameter.
          <div className="mt-2 text-xs text-slate-500">
            Example: <span className="font-mono">/portal/status?run=&lt;UUID&gt;</span>
          </div>
        </div>
      </div>
    );
  }

  const tfOutputs: TerraformOutputs | null =
    outputs?.found && outputs.outputs ? (outputs.outputs as TerraformOutputs) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="mt-1 text-xs text-slate-500 font-mono">{runId}</div>
        </div>

        <button
          onClick={handleCancel}
          className="rounded-md border border-red-800 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30"
        >
          Cancel Run
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Basic run summary */}
      {run ? (
        <div className="rounded-lg border border-slate-800 p-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <div className="text-slate-400 text-xs">Title</div>
              <div className="text-slate-100">{run.title}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Status</div>
              <div className="text-slate-100">{run.status}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Stage</div>
              <div className="text-slate-100">{run.stage}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Pipeline Run</div>
              <div className="text-slate-100">{run.deploy?.pipeline_run_id ?? "-"}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400">Loading run...</div>
      )}

      {/* Terraform outputs (from /api/infra/outputs/{runId}) */}
      {tfOutputs ? <TerraformOutputsTable outputs={tfOutputs} /> : null}

      {/* Events */}
      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Events</h2>
        {events.length === 0 ? (
          <div className="text-sm text-slate-400">No events yet...</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border-t border-slate-800 pt-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-xs text-slate-500">#{e.id}</span>
                  <span className="text-xs text-slate-400">{e.stage}</span>
                  <span className="text-xs text-slate-400">{e.status}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-200">{e.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Terraform Outputs Renderer
========================================================= */

function TerraformOutputsTable({ outputs }: { outputs: TerraformOutputs }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Terraform Outputs</h2>

      <table className="w-full text-sm">
        <tbody>
          {typedEntries(outputs).map(([key, output]) => {
            const value = output.value;

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
