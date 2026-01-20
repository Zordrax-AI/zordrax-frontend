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

type TerraformOutputs = Record<
  string,
  { type: string; value: unknown; sensitive: boolean }
>;

function entries(obj: TerraformOutputs): [string, TerraformOutputs[string]][] {
  return Object.entries(obj);
}

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run") ?? ""; // <- FIX: never string|null

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState(0);

  const [outputsResp, setOutputsResp] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState<string>("");

  const outputs = useMemo(() => {
    const o = outputsResp?.outputs;
    return o && typeof o === "object" ? (o as TerraformOutputs) : null;
  }, [outputsResp]);

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
        setOutputsResp(out);
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

        const out = await getInfraOutputs(runId);
        if (!alive) return;
        setOutputsResp(out);
      } catch {
        // keep polling; don’t spam UI
      }
    }, 2000);

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
      <div className="rounded-lg border border-slate-800 p-4 text-sm text-slate-200">
        No run id provided. Open a status page like:
        <div className="mt-2 font-mono text-cyan-300">/portal/status?run=&lt;uuid&gt;</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="text-xs text-slate-300 font-mono break-all">{runId}</div>

          {run && (
            <div className="text-sm text-slate-200">
              Status: <span className="text-cyan-300">{run.status}</span> • Stage:{" "}
              <span className="text-cyan-300">{run.stage}</span>
              {run.deploy?.pipeline_run_id != null && (
                <>
                  {" "}
                  • Pipeline Run:{" "}
                  <span className="text-cyan-300">{String(run.deploy.pipeline_run_id)}</span>
                </>
              )}
              {run.deploy?.region && (
                <>
                  {" "}
                  • Region: <span className="text-cyan-300">{run.deploy.region}</span>
                </>
              )}
              {run.deploy?.environment && (
                <>
                  {" "}
                  • Env: <span className="text-cyan-300">{run.deploy.environment}</span>
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
        <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {outputs && (
        <TerraformOutputsTable outputs={outputs} status={outputsResp?.status ?? ""} />
      )}

      <EventLog events={events} />
    </div>
  );
}

function TerraformOutputsTable({
  outputs,
  status,
}: {
  outputs: TerraformOutputs;
  status: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Terraform Outputs</h2>
        <div className="text-xs text-slate-400">status: {status}</div>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {entries(outputs).map(([key, output]) => {
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

function EventLog({ events }: { events: RunEvent[] }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Event Log</h2>

      <div className="space-y-3">
        {events.length === 0 && (
          <div className="text-sm text-slate-400">No events yet.</div>
        )}

        {events.map((e) => (
          <div key={e.id} className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-xs text-slate-400 font-mono">
              #{e.id} • {e.level} • {e.stage} • {e.status} •{" "}
              {new Date(e.created_at).toLocaleString()}
            </div>
            <div className="text-sm text-slate-200">{e.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
