"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRun,
  getRunEvents,
  cancelRun,
  type RunEvent,
  type RunRow,
  type TerraformOutputs,
  type TerraformOutputValue,
} from "@/lib/api";

/* =========================
   Typed Object.entries helper
========================= */
function typedEntries(
  outputs: TerraformOutputs
): [string, TerraformOutputValue][] {
  return Object.entries(outputs) as [string, TerraformOutputValue][];
}

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

  async function handleCancel() {
    if (!runId) return;
    await cancelRun(runId);
    alert("Cancel requested");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Run Status</h1>

      {run?.manifest?.outputs && (
        <TerraformOutputsTable outputs={run.manifest.outputs} />
      )}
    </div>
  );
}

/* =========================
   Terraform Outputs Renderer
========================= */
function TerraformOutputsTable({
  outputs,
}: {
  outputs: TerraformOutputs;
}) {
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
