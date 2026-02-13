"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { deployRefresh, getInfraOutputs, type InfraOutputsResponse } from "@/lib/api";

type TerraformOutputs = Record<string, { value: unknown; sensitive?: boolean; type?: string }>;

function typedEntries(outputs: TerraformOutputs) {
  return Object.entries(outputs) as [string, TerraformOutputs[string]][];
}

export default function StatusClient() {
  const params = useSearchParams();
  const runIdParam = params.get("run");

  const runId = useMemo(() => runIdParam || "", [runIdParam]);

  const [run, setRun] = useState<any | null>(null);
  const [infra, setInfra] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!runId) return;

    let alive = true;

    async function tick() {
      try {
        setError("");

        const r = await deployRefresh(runId);
        if (!alive) return;

        // store what we need from refresh
        setRun({
          run_id: runId,
          status: r.current_status,
          stage: "deploy",
          mode: "deploy",
          cancel_requested: false,
          created_at: "",
          updated_at: "",
        } as any);

        const i = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(i);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Polling failed");
      }
    }

    tick();
    const timer = setInterval(tick, 2500);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [runId]);

  if (!runId) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Run Status</h1>
        <div className="text-sm opacity-80">
          Missing <code>?run=</code> query param.
        </div>
      </div>
    );
  }

  const outputs = (infra?.outputs || {}) as any as TerraformOutputs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <div className="text-sm opacity-70 break-all">Run ID: {runId}</div>
          {run && (
            <div className="text-sm opacity-80">
              Status: <span className="font-mono">{run.status}</span> • Stage:{" "}
              <span className="font-mono">{run.stage}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-200">
          {error}
        </div>
      )}

      {infra?.found && Object.keys(outputs).length > 0 ? (
        <TerraformOutputsTable outputs={outputs} />
      ) : (
        <div className="rounded-lg border border-slate-800 p-4 text-sm opacity-80">
          Terraform outputs not available yet.
        </div>
      )}

      <div className="rounded-lg border border-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold">Event Timeline</h2>
        <div className="text-sm opacity-70">Not enabled for deploy runs.</div>
      </div>
    </div>
  );
}

function TerraformOutputsTable({ outputs }: { outputs: TerraformOutputs }) {
  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold">Terraform Outputs</h2>

      <table className="w-full text-sm">
        <tbody>
          {typedEntries(outputs).map(([key, output]) => {
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
