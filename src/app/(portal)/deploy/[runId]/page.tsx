// src/app/(portal)/deploy/[runId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deployApprove, deployGetPackage, deployOutputs, deployRefresh } from "@/lib/deploy";

export default function DeployRunPage({ params }: { params: { runId: string } }) {
  const runId = params.runId;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [pkgResp, setPkgResp] = useState<any>(null);
  const [refreshResp, setRefreshResp] = useState<any>(null);
  const [outputsResp, setOutputsResp] = useState<any>(null);

  const deploy = pkgResp?.deploy;
  const run = pkgResp?.run;
  const pkg = pkgResp?.package;
  const infra = pkgResp?.infra;
  const events = pkgResp?.events ?? [];

  const canApprove = useMemo(() => {
    if (!deploy) return false;
    // backend: deploy.approved boolean + statuses
    return deploy.approved !== true;
  }, [deploy]);

  async function loadAll() {
    try {
      setErr(null);
      setLoading(true);
      const r = await deployGetPackage(runId);
      setPkgResp(r);

      const out = await deployOutputs(runId);
      setOutputsResp(out);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load deploy run");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    try {
      setErr(null);
      const r = await deployRefresh(runId);
      setRefreshResp(r);
      // re-fetch package to reflect new status/events/infra
      const p = await deployGetPackage(runId);
      setPkgResp(p);
      const out = await deployOutputs(runId);
      setOutputsResp(out);
    } catch (e: any) {
      setErr(e?.message ?? "Refresh failed");
    }
  }

  async function onApprove() {
    try {
      setErr(null);
      const a = await deployApprove(runId);
      // show approve response briefly + refresh state
      setRefreshResp(a);
      await onRefresh();
    } catch (e: any) {
      setErr(e?.message ?? "Approve failed");
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  if (loading) return <div className="p-6">Loading deploy run…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deploy Run</h1>
          <div className="text-sm opacity-80">Run ID: {runId}</div>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border" onClick={onRefresh}>
            Refresh
          </button>
          <button className="px-3 py-2 rounded border" onClick={onApprove} disabled={!canApprove}>
            Approve (trigger infra)
          </button>
        </div>
      </div>

      {err && <div className="p-3 rounded border border-red-400 text-red-700">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded border">
          <h2 className="font-semibold mb-2">Current Status</h2>
          <div className="text-sm">run.status: {run?.status ?? "n/a"}</div>
          <div className="text-sm">deploy.status: {deploy?.status ?? "n/a"}</div>
          <div className="text-sm">deploy.approved: {String(deploy?.approved ?? false)}</div>
          <div className="text-sm">pipeline_run_id: {run?.pipeline_run_id ?? "n/a"}</div>
        </div>

        <div className="p-4 rounded border">
          <h2 className="font-semibold mb-2">Package</h2>
          <div className="text-sm">package_id: {pkg?.package_id ?? "n/a"}</div>
          <div className="text-sm">status: {pkg?.status ?? "n/a"}</div>
          <div className="text-sm">
            requirement_set_id:{" "}
            {pkg?.requirement_set_id ? (
              <Link className="underline" href={`/onboarding/${pkg.requirement_set_id}`}>
                {pkg.requirement_set_id}
              </Link>
            ) : (
              "n/a"
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded border">
        <h2 className="font-semibold mb-2">Infra</h2>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(infra, null, 2)}</pre>
      </div>

      <div className="p-4 rounded border">
        <h2 className="font-semibold mb-2">Terraform Outputs</h2>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(outputsResp, null, 2)}</pre>
      </div>

      <div className="p-4 rounded border">
        <h2 className="font-semibold mb-2">Events (latest first)</h2>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(events, null, 2)}</pre>
      </div>

      {refreshResp && (
        <div className="p-4 rounded border">
          <h2 className="font-semibold mb-2">Last Action Response</h2>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(refreshResp, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
