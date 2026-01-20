"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getRun,
  getRunEvents,
  cancelRun,
  getInfraOutputs,
  type RunEvent,
  type RunRow,
  type InfraOutputsResponse,
} from "@/lib/api";

type Outputs = NonNullable<InfraOutputsResponse["outputs"]>;

function safeJson(v: unknown) {
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run") ?? "";

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [outputsStatus, setOutputsStatus] = useState<string | null>(null);

  const lastIdRef = useRef<number>(0);

  const hasRunId = runId.trim().length > 0;

  const header = useMemo(() => {
    if (!run) return null;
    return {
      status: run.status,
      stage: run.stage,
      pipelineRunId: run.deploy?.pipeline_run_id || null,
      region: run.deploy?.region || null,
      environment: run.deploy?.environment || null,
    };
  }, [run]);

  useEffect(() => {
    if (!hasRunId) return;

    let alive = true;

    async function bootstrap() {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);
      } catch {
        // ignore, UI will just show "no run loaded"
      }

      try {
        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setOutputsStatus(out.status ?? null);
        setOutputs(out.found ? out.outputs ?? null : null);
      } catch {
        // ignore
      }
    }

    bootstrap();

    const eventsTimer = setInterval(async () => {
      try {
        const after = lastIdRef.current;
        const ev = await getRunEvents(runId, after);
        if (!alive) return;

        if (ev.length) {
          lastIdRef.current = ev[ev.length - 1].id;
          setEvents((prev) => [...prev, ...ev]);
        }
      } catch {
        // ignore
      }
    }, 2000);

    const outputsTimer = setInterval(async () => {
      try {
        const out = await getInfraOutputs(runId);
        if (!alive) return;

        setOutputsStatus(out.status ?? null);
        setOutputs(out.found ? out.outputs ?? null : null);
      } catch {
        // ignore
      }
    }, 5000);

    return () => {
      alive = false;
      clearInterval(eventsTimer);
      clearInterval(outputsTimer);
    };
  }, [hasRunId, runId]);

  async function handleCancel() {
    if (!hasRunId) return;
    await cancelRun(runId);
    alert("Cancel requested");
  }

  if (!hasRunId) {
    return (
      <div className="rounded-lg border border-slate-800 p-4 text-sm text-slate-300">
        Missing <span className="font-mono">?run=&lt;uuid&gt;</span> in the URL.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="text-xs text-slate-400 font-mono">{runId}</div>

          {header ? (
            <div className="text-xs text-slate-400">
              Status: <span className="text-slate-200">{header.status}</span>{" "}
              • Stage: <span className="text-slate-200">{header.stage}</span>
              {header.pipelineRunId ? (
                <>
                  {" "}
                  • Pipeline Run:{" "}
                  <span className="text-slate-200">{header.pipelineRunId}</span>
                </>
              ) : null}
              {header.region ? (
                <>
                  {" "}
                  • Region: <span className="text-slate-200">{header.region}</span>
                </>
              ) : null}
              {header.environment ? (
                <>
                  {" "}
                  • Env:{" "}
                  <span className="text-slate-200">{header.environment}</span>
                </>
              ) : null}
            </div>
          ) : null}
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
            {outputsStatus ? `status: ${outputsStatus}` : "status: unknown"}
          </div>
        </div>

        {outputs && Object.keys(outputs).length ? (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(outputs).map(([key, out]) => (
                <tr key={key} className="border-t border-slate-800">
                  <td className="py-2 pr-4 font-mono text-cyan-300 align-top">
                    {key}
                  </td>
                  <td className="py-2 font-mono text-slate-300 break-all">
                    {out?.sensitive ? (
                      <span className="text-slate-500">[sensitive]</span>
                    ) : (
                      <pre className="whitespace-pre-wrap">{safeJson(out?.value)}</pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-3 text-sm text-slate-400">
            No outputs yet. This will populate after the callback lands and the
            agent stores Terraform outputs.
          </div>
        )}
      </div>

      {/* Events */}
      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="text-sm font-semibold">Event Log</h2>

        {events.length ? (
          <div className="mt-3 space-y-2">
            {events.slice(-50).map((e) => (
              <div
                key={e.id}
                className="rounded border border-slate-800 bg-slate-950/40 p-2"
              >
                <div className="text-xs text-slate-400">
                  #{e.id} • {e.level} • {e.stage} • {e.status} •{" "}
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="text-sm text-slate-200">{e.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-400">
            No events yet (or waiting for polling).
          </div>
        )}
      </div>
    </div>
  );
}
