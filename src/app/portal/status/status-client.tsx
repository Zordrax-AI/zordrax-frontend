"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  cancelRun,
  getInfraOutputs,
  getRun,
  getRunEvents,
  type InfraOutputsResponse,
  type RunEvent,
  type RunRow,
} from "@/lib/api";

type TerraformOutputs = NonNullable<InfraOutputsResponse["outputs"]>;

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run"); // string | null

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [outputs, setOutputs] = useState<TerraformOutputs | null>(null);
  const [outputsStatus, setOutputsStatus] = useState<string | null>(null);

  const lastIdRef = useRef(0);

  useEffect(() => {
    if (!runId) return;

    let alive = true;

    async function bootstrap() {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setOutputsStatus(out.status ?? null);
        setOutputs(out.outputs ?? null);

        const ev = await getRunEvents(runId, 0);
        if (!alive) return;
        setEvents(ev);
        lastIdRef.current = ev.length ? ev[ev.length - 1].id : 0;
      } catch (e) {
        // keep UI resilient
        console.error(e);
      }
    }

    bootstrap();

    const timer = setInterval(async () => {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        const ev = await getRunEvents(runId, lastIdRef.current);
        if (!alive) return;
        if (ev.length) {
          setEvents((prev) => [...prev, ...ev]);
          lastIdRef.current = ev[ev.length - 1].id;
        }

        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setOutputsStatus(out.status ?? null);
        setOutputs(out.outputs ?? null);
      } catch (e) {
        console.error(e);
      }
    }, 2000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [runId]);

  async function handleCancel() {
    if (!runId) return;
    await cancelRun(runId);
    alert("Cancel requested");
  }

  if (!runId) {
    return (
      <div className="rounded-md border border-slate-800 p-4 text-sm text-slate-300">
        Missing <span className="font-mono">?run=</span> in URL.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="mt-2 text-xs text-slate-400">
            <div className="font-mono">{runId}</div>
            {run ? (
              <div className="mt-1">
                Status: <span className="text-slate-200">{run.status}</span> •
                Stage: <span className="text-slate-200">{run.stage}</span> •
                Pipeline Run:{" "}
                <span className="text-slate-200">
                  {run.deploy?.pipeline_run_id ?? "—"}
                </span>{" "}
                • Region:{" "}
                <span className="text-slate-200">{run.deploy?.region ?? "—"}</span>{" "}
                • Env:{" "}
                <span className="text-slate-200">
                  {run.deploy?.environment ?? "—"}
                </span>
              </div>
            ) : (
              <div className="mt-1">Loading run...</div>
            )}
          </div>
        </div>

        <button
          onClick={handleCancel}
          className="rounded-md border border-red-800 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30"
        >
          Cancel Run
        </button>
      </div>

      {/* Outputs */}
      <div className="rounded-lg border border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Terraform Outputs</h2>
          <div className="text-xs text-slate-400">
            status: <span className="text-slate-200">{outputsStatus ?? "—"}</span>
          </div>
        </div>

        {outputs ? (
          <OutputsTable outputs={outputs} />
        ) : (
          <div className="mt-3 text-sm text-slate-400">No outputs yet.</div>
        )}
      </div>

      {/* Events */}
      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Event Log</h2>

        {events.length ? (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="rounded-md border border-slate-900 bg-slate-950/40 p-3">
                <div className="text-xs text-slate-400">
                  #{e.id} • {e.level} • {e.stage} • {e.status} •{" "}
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-slate-200">{e.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No events yet.</div>
        )}
      </div>
    </div>
  );
}

function OutputsTable({ outputs }: { outputs: TerraformOutputs }) {
  const entries = Object.entries(outputs);

  return (
    <table className="mt-3 w-full text-sm">
      <tbody>
        {entries.map(([key, output]) => {
          const value = output?.value;
          return (
            <tr key={key} className="border-t border-slate-800">
              <td className="py-2 font-mono text-cyan-300">{key}</td>
              <td className="py-2 font-mono text-slate-300 break-all">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
