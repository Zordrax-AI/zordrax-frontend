"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run"); // string | null

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState<number>(0);

  const [outputs, setOutputs] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ HARD GUARD
    if (!runId) {
      setError("No run id provided. Open: /portal/status?run=<uuid>");
      return;
    }

    // ✅ CAPTURE NON-NULL STRING (THIS IS THE FIX)
    const rid: string = runId;

    let alive = true;
    setError(null);

    async function bootstrap() {
      try {
        const r = await getRun(rid);
        if (!alive) return;
        setRun(r);

        const out = await getInfraOutputs(rid);
        if (!alive) return;
        setOutputs(out);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load run");
      }
    }

    bootstrap();

    const timer = setInterval(async () => {
      if (!alive) return;

      try {
        const ev = await getRunEvents(rid, lastId);
        if (!alive) return;

        if (ev.length) {
          setEvents((prev) => [...prev, ...ev]);
          setLastId(ev[ev.length - 1].id);
        }

        // refresh run
        const r = await getRun(rid);
        if (!alive) return;
        setRun(r);

        // refresh outputs
        const out = await getInfraOutputs(rid);
        if (!alive) return;
        setOutputs(out);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Status poll failed");
      }
    }, 2000);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Run Status</h1>

          {runId ? (
            <div className="font-mono text-xs text-slate-400">{runId}</div>
          ) : (
            <div className="text-sm text-slate-400">
              /portal/status?run=&lt;uuid&gt;
            </div>
          )}

          {run && (
            <div className="text-sm text-slate-300">
              Status: <span className="text-slate-100">{run.status}</span> •
              Stage: <span className="text-slate-100">{run.stage}</span> •
              Pipeline Run:{" "}
              <span className="text-slate-100">
                {String(run.deploy?.pipeline_run_id ?? "-")}
              </span>{" "}
              • Region:{" "}
              <span className="text-slate-100">
                {run.deploy?.region ?? "-"}
              </span>{" "}
              • Env:{" "}
              <span className="text-slate-100">
                {run.deploy?.environment ?? "-"}
              </span>
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
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {outputs?.found && outputs?.outputs && (
        <TerraformOutputsTable
          outputs={outputs.outputs as TerraformOutputs}
          status={outputs.status}
        />
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
  const entries = Object.entries(outputs);

  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Terraform Outputs</h2>
        <div className="text-xs text-slate-400">status: {status}</div>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, output]) => {
            const value = output.value;
            return (
              <tr key={key} className="border-t border-slate-800 align-top">
                <td className="py-2 pr-4 font-mono text-cyan-300">{key}</td>
                <td className="py-2 font-mono text-slate-300 break-all">
                  {typeof value === "string"
                    ? value
                    : JSON.stringify(value, null, 2)}
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

      {events.length === 0 ? (
        <div className="text-sm text-slate-400">No events yet.</div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-md border border-slate-800 bg-slate-950/20 p-3"
            >
              <div className="text-xs text-slate-400">
                #{e.id} • {e.level} • {e.stage} • {e.status} •{" "}
                {new Date(e.created_at).toLocaleString()}
              </div>
              <div className="text-sm text-slate-100">{e.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
