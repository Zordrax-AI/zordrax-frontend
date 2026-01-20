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

/* =========================================================
   Local types for rendering outputs
========================================================= */

type TerraformOutputValue = {
  value: unknown;
};

type TerraformOutputs = Record<string, TerraformOutputValue>;

function toTerraformOutputs(resp: InfraOutputsResponse | null): TerraformOutputs | null {
  if (!resp?.outputs) return null;

  const mapped: TerraformOutputs = {};
  for (const [k, v] of Object.entries(resp.outputs)) {
    mapped[k] = { value: v.value };
  }
  return mapped;
}

function typedEntries(outputs: TerraformOutputs): [string, TerraformOutputValue][] {
  return Object.entries(outputs);
}

/* =========================================================
   Component
========================================================= */

export default function StatusClient() {
  const params = useSearchParams();
  const runIdParam = params.get("run");

  // Make a stable string for TS + memo
  const runId = useMemo(() => (runIdParam ? String(runIdParam) : ""), [runIdParam]);

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState(0);
  const [infra, setInfra] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const outputs = useMemo(() => toTerraformOutputs(infra), [infra]);

  useEffect(() => {
    if (!runId) return;

    let alive = true;

    async function bootstrap() {
      try {
        setError(null);

        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(out);

        const ev = await getRunEvents(runId, 0);
        if (!alive) return;
        setEvents(ev);
        if (ev.length) setLastId(ev[ev.length - 1].id);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load run status");
      }
    }

    bootstrap();

    return () => {
      alive = false;
    };
  }, [runId]);

  // Poll events
  useEffect(() => {
    if (!runId) return;

    let alive = true;

    const timer = setInterval(async () => {
      try {
        const ev = await getRunEvents(runId, lastId);
        if (!alive) return;

        if (ev.length) {
          setEvents((prev) => [...prev, ...ev]);
          setLastId(ev[ev.length - 1].id);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [runId, lastId]);

  // Poll run + outputs
  useEffect(() => {
    if (!runId) return;

    let alive = true;

    const timer = setInterval(async () => {
      try {
        const r = await getRun(runId);
        if (!alive) return;
        setRun(r);

        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(out);
      } catch {
        // ignore
      }
    }, 5000);

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
      <div className="rounded-lg border border-slate-800 p-4 text-sm text-slate-300">
        No run id provided. Open a status page like:
        <div className="mt-2 font-mono text-cyan-300">/portal/status?run=&lt;uuid&gt;</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="mt-2 text-xs text-slate-400 font-mono">{runId}</div>

          {run && (
            <div className="mt-2 text-sm text-slate-300">
              Status: <span className="text-slate-100">{run.status}</span>
              {" • "}
              Stage: <span className="text-slate-100">{run.stage}</span>
              {run.deploy?.pipeline_run_id != null && (
                <>
                  {" • "}
                  Pipeline Run:{" "}
                  <span className="text-slate-100">{String(run.deploy.pipeline_run_id)}</span>
                </>
              )}
              {run.deploy?.region && (
                <>
                  {" • "}
                  Region: <span className="text-slate-100">{run.deploy.region}</span>
                </>
              )}
              {run.deploy?.environment && (
                <>
                  {" • "}
                  Env: <span className="text-slate-100">{run.deploy.environment}</span>
                </>
              )}
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
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Terraform outputs */}
      {outputs && (
        <TerraformOutputsTable outputs={outputs} />
      )}

      {/* Event log */}
      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Event Log</h2>

        {events.length === 0 ? (
          <div className="text-sm text-slate-400">No events yet.</div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="rounded-md border border-slate-800 p-3">
                <div className="text-xs text-slate-400">
                  #{e.id} • {e.level} • {e.stage} • {e.status} •{" "}
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-slate-200">{e.message}</div>
              </div>
            ))}
          </div>
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Terraform Outputs</h2>
        <div className="text-xs text-slate-400">status: succeeded</div>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {typedEntries(outputs).map(([key, output]) => {
            const value = output.value;

            return (
              <tr key={key} className="border-t border-slate-800 align-top">
                <td className="py-2 pr-4 font-mono text-cyan-300">{key}</td>
                <td className="py-2 font-mono text-slate-300 break-all whitespace-pre-wrap">
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
