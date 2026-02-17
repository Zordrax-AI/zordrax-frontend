"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deployRefresh, getInfraOutputs, type InfraOutputsResponse } from "@/lib/api";

type Refresh = Awaited<ReturnType<typeof deployRefresh>> | null;

export default function RunDetailPage() {
  const params = useParams<{ run_id: string }>();
  const router = useRouter();
  const runId = useMemo(() => params?.run_id ?? "", [params]);

  const [refresh, setRefresh] = useState<Refresh>(null);
  const [infra, setInfra] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!runId) return;
    let alive = true;

    async function tick() {
      try {
        const r = await deployRefresh(runId);
        if (!alive) return;
        setRefresh(r);

        const outputs = await getInfraOutputs(runId);
        if (!alive) return;
        setInfra(outputs);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load run");
      }
    }

    tick();
    timer.current = setInterval(tick, 3000);

    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [runId]);

  const status = refresh?.current_status || "unknown";
  const pipelineLink = refresh?.pipeline?.url;
  const outputs = infra?.outputs ?? {};

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Run</h1>
          <div className="text-sm text-slate-400 break-all">Run ID: {runId}</div>
          <div className="mt-1 text-sm text-slate-300">
            Status: <span className="font-mono text-cyan-200">{status}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.refresh()}>
          Refresh now
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</div>
      )}

      <Card className="p-4 space-y-3">
        <div className="text-sm text-slate-200">Pipeline</div>
        <div className="text-sm text-slate-400">
          State: <span className="font-mono text-slate-100">{refresh?.pipeline?.state ?? "—"}</span>{" "}
          Result: <span className="font-mono text-slate-100">{refresh?.pipeline?.result ?? "—"}</span>
        </div>
        {pipelineLink ? (
          <a
            className="text-cyan-300 text-sm underline"
            href={pipelineLink}
            target="_blank"
            rel="noreferrer"
          >
            Open pipeline
          </a>
        ) : (
          <div className="text-xs text-slate-500">No pipeline link available yet.</div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-200">Terraform outputs</div>
        {outputs && Object.keys(outputs).length > 0 ? (
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(outputs).map(([key, val]) => (
                <tr key={key} className="border-t border-slate-800">
                  <td className="py-2 font-mono text-cyan-300">{key}</td>
                  <td className="py-2 font-mono text-slate-200 break-all">
                    {typeof (val as any)?.value === "string"
                      ? (val as any).value
                      : typeof val === "string"
                      ? val
                      : JSON.stringify((val as any)?.value ?? val ?? null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-slate-400">Outputs not available yet.</div>
        )}
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-semibold text-slate-200">Timeline</div>
        <div className="text-sm text-slate-500">Coming soon.</div>
      </Card>
    </div>
  );
}
