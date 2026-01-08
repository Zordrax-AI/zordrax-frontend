"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRun,
  getRunEvents,
  cancelRun,
  RunEvent,
  RunRow,
  TerraformOutputs as TerraformOutputsType,
} from "@/lib/api";

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState(0);

  useEffect(() => {
    if (!runId) return;

    getRun(runId).then(setRun);

    const timer = setInterval(async () => {
      const ev = await getRunEvents(runId, lastId);
      if (ev.length) {
        setEvents((prev) => [...prev, ...ev]);
        setLastId(ev[ev.length - 1].event_id);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [runId, lastId]);

  useEffect(() => {
    const el = document.getElementById("log-end");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  async function handleCancel() {
    if (!runId) return;
    await cancelRun(runId);
    alert("Cancel requested");
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
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

      {/* SUMMARY */}
      <div className="rounded-lg border border-slate-800 p-4 text-sm">
        <div><b>Status:</b> {run?.status}</div>
        <div><b>Stage:</b> {run?.stage}</div>
        <div><b>Mode:</b> {run?.mode}</div>
      </div>

      {run?.status === "completed" && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300">
          ✅ Deployment completed successfully
        </div>
      )}

      {/* LOGS */}
      <div className="rounded-lg border border-slate-800 bg-black p-4 font-mono text-xs space-y-1 max-h-[400px] overflow-auto">
        {events.map((e) => (
          <div key={e.event_id}>
            [{e.stage}] {e.message}
          </div>
        ))}
        <div id="log-end" />
      </div>

      {/* TERRAFORM OUTPUTS */}
      {run?.manifest?.outputs && (
        <TerraformOutputs outputs={run.manifest.outputs} />
      )}
    </div>
  );
}

/* =========================
   Terraform Outputs
========================= */

function TerraformOutputs({
  outputs,
}: {
  outputs: TerraformOutputsType;
}) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Terraform Outputs</h2>

      <table className="w-full text-sm">
        <tbody>
          {Object.entries(outputs).map(([key, v]) => (
            <tr key={key} className="border-t border-slate-800">
              <td className="py-2 font-mono text-cyan-300">
                {key}
              </td>
              <td className="py-2 font-mono text-slate-300 break-all">
                {typeof v.value === "string"
                  ? v.value
                  : JSON.stringify(v.value, null, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
