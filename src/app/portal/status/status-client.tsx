"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRun,
  getRunEvents,
  cancelRun,
  RunEvent,
} from "@/lib/api";

export default function StatusClient() {
  const runId = useSearchParams().get("run");

  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState(0);
  const [run, setRun] = useState<any>(null);

  useEffect(() => {
    if (!runId) return;

    getRun(runId).then(setRun);

    const i = setInterval(async () => {
      const ev = await getRunEvents(runId, lastId);
      if (ev.length) {
        setEvents((p) => [...p, ...ev]);
        setLastId(ev[ev.length - 1].event_id);
      }
    }, 2000);

    return () => clearInterval(i);
  }, [runId, lastId]);

  async function handleCancel() {
    if (!runId) return;
    await cancelRun(runId);
    alert("Cancel requested");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <p className="text-sm text-slate-400">
            {run?.title} — {run?.status}
          </p>
        </div>

        {run?.status === "running" && (
          <button
            onClick={handleCancel}
            className="rounded-md bg-red-500/20 px-4 py-2 text-sm text-red-300"
          >
            Cancel Run
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-800 bg-black p-4 font-mono text-xs max-h-[400px] overflow-auto">
        {events.map((e) => (
          <div key={e.event_id}>
            [{e.stage}] {e.message}
          </div>
        ))}
      </div>

      {run?.status === "completed" && run?.manifest?.outputs && (
        <TerraformOutputs outputs={run.manifest.outputs} />
      )}
    </div>
  );
}

function TerraformOutputs({ outputs }: { outputs: any }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Terraform Outputs</h2>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(outputs).map(([k, v]: any) => (
            <tr key={k} className="border-t border-slate-800">
              <td className="py-2 font-mono text-cyan-300">{k}</td>
              <td className="py-2 font-mono text-slate-300">
                {JSON.stringify(v.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
