"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  getRun,
  getRunEvents,
  cancelRun,
  getInfraOutputs,
  type InfraOutputsResponse,
  type RunEvent,
  type RunRow,
} from "@/lib/api";

/* =========================================================
   Terraform output display types
========================================================= */

type TerraformOutputs = Record<string, { value: unknown }>;

function typedEntries(outputs: TerraformOutputs): [string, { value: unknown }][] {
  return Object.entries(outputs);
}

export default function StatusClient() {
  const params = useSearchParams();
  const runParam = params.get("run"); // string | null

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [infra, setInfra] = useState<InfraOutputsResponse | null>(null);

  const lastIdRef = useRef<number>(0);

  useEffect(() => {
    if (!runParam) return;

    let alive = true;

    setRun(null);
    setEvents([]);
    setInfra(null);
    setError(null);
    lastIdRef.current = 0;

    async function bootstrap(runId: string) {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        // outputs may or may not exist yet — that's fine
        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(out);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load run");
      }
    }

    bootstrap(runParam);

    const timer = setInterval(async () => {
      try {
        const runId = runParam;

        // 1) poll events
        const ev = await getRunEvents(runId, lastIdRef.current);
        if (!alive) return;

        if (ev.length) {
          setEvents((prev) => [...prev, ...ev]);
          lastIdRef.current = ev[ev.length - 1].id;
        }

        // 2) refresh run summary
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        // 3) refresh infra outputs (cheap and safe)
        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(out);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Polling error");
      }
    }, 2000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [runParam]);

  async function handleCancel() {
    if (!runParam) return;
    await cancelRun(runParam);
    alert("Cancel requested");
  }

  if (!runParam) {
    return (
      <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
        No run id provided. Open a status page like:
        <div className="mt-2 font-mono text-xs text-slate-400">
          /portal/status?run=&lt;uuid&gt;
        </div>
      </div>
    );
  }

  // Convert backend outputs shape to a simple { key: { value } } map for display
  const displayOutputs: TerraformOutputs | null =
    infra?.found && infra.outputs
      ? Object.fromEntries(
          Object.entries(infra.outputs).map(([k, v]) => [k, { value: v.value }])
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="mt-1 text-xs text-slate-400 font-mono break-all">
            {runParam}
          </div>

          {run && (
            <div className="mt-2 text-sm text-slate-300">
              Status: <span className="text-slate-100">{run.status}</span>
              {" · "}
              Stage: <span className="text-slate-100">{run.stage}</span>
              {run.deploy?.pipeline_run_id ? (
                <>
                  {" · "}
                  Pipeline Run:{" "}
                  <span className="text-slate-100">
                    {String(run.deploy.pipeline_run_id)}
                  </span>
                </>
              ) : null}
              {run.deploy?.region ? (
                <>
                  {" · "}
                  Region: <span className="text-slate-100">{run.deploy.region}</span>
                </>
              ) : null}
              {run.deploy?.environment ? (
                <>
                  {" · "}
                  Env: <span className="text-slate-100">{run.deploy.environment}</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        <button
          onClick={handleCancel}
          className="shrink-0 rounded-md border border-red-800 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30"
        >
          Cancel Run
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Terraform Outputs */}
      <div className="rounded-lg border border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Terraform Outputs</h2>
          <div className="text-xs text-slate-400">
            status: {infra?.status ?? "unknown"}
          </div>
        </div>

        {!infra ? (
          <div className="mt-3 text-sm text-slate-400">Loading outputs…</div>
        ) : !infra.found ? (
          <div className="mt-3 text-sm text-slate-400">
            No outputs found yet (still running or not applied).
          </div>
        ) : displayOutputs && Object.keys(displayOutputs).length > 0 ? (
          <TerraformOutputsTable outputs={displayOutputs} />
        ) : (
          <div className="mt-3 text-sm text-slate-400">No outputs.</div>
        )}
      </div>

      <EventLog events={events} />
    </div>
  );
}

function TerraformOutputsTable({ outputs }: { outputs: TerraformOutputs }) {
  return (
    <table className="mt-3 w-full text-sm">
      <tbody>
        {typedEntries(outputs).map(([key, output]) => {
          const value = output.value;

          return (
            <tr key={key} className="border-t border-slate-800">
              <td className="py-2 pr-4 font-mono text-cyan-300">{key}</td>
              <td className="py-2 font-mono text-slate-300 break-all">
                {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function EventLog({ events }: { events: RunEvent[] }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Event Log</h2>

      {events.length === 0 ? (
        <div className="text-sm text-slate-400">No events yet.</div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-500">
                #{e.id} • {e.level} • {e.stage} • {e.status} •{" "}
                {new Date(e.created_at).toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-slate-200">{e.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
