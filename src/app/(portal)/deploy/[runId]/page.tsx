"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { zaFetch } from "@/lib/za";
import StageTimeline from "@/components/StageTimeline";
import JsonViewer from "@/components/JsonViewer";

type Refresh = {
  previous_status?: string;
  current_status?: string;
  pipeline?: { state?: string; result?: string; url?: string };
};

export const dynamic = "force-dynamic";

export default function DeployRunPage() {
  const params = useParams<{ runId: string }>();
  const runId = params?.runId || "";

  const [refresh, setRefresh] = useState<Refresh | null>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [applyAcknowledged, setApplyAcknowledged] = useState(false);
  const [applyBlockedNotApproved, setApplyBlockedNotApproved] = useState(false);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function poll() {
    if (!runId) return;
    try {
      const data = await zaFetch(`/api/deploy/${encodeURIComponent(runId)}/refresh`, { method: "POST" });
      setRefresh(data);
    } catch (e: any) {
      setError(e?.message || "Failed to refresh");
    }
  }

  async function approve() {
    await runAction("approve", `/api/deploy/${encodeURIComponent(runId)}/approve`);
  }
  async function apply() {
    await runAction("apply", `/api/deploy/${encodeURIComponent(runId)}/apply`, { guardNotApproved: true });
  }
  async function runAction(key: string, path: string, opts?: { guardNotApproved?: boolean }) {
    setLoadingAction(key);
    setError(null);
    try {
      await zaFetch(path, { method: "POST" });
      if (key === "apply") setApplyBlockedNotApproved(false);
      await poll();
    } catch (e: any) {
      const msg = e?.message || `${key} failed`;
      setError(msg);
      if (opts?.guardNotApproved && msg.toLowerCase().includes("not approved")) {
        setApplyBlockedNotApproved(true);
      }
    } finally {
      setLoadingAction(null);
    }
  }

  async function loadPackage() {
    setLoadingAction("package");
    setError(null);
    try {
      const data = await zaFetch(`/api/deploy/${encodeURIComponent(runId)}/package`, { method: "GET" });
      setPackageData(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load package");
    } finally {
      setLoadingAction(null);
    }
  }

  const status = refresh?.current_status || "unknown";
  const applyEnvEnabled = process.env.NEXT_PUBLIC_ENABLE_INFRA_APPLY === "true";
  const isApproved = typeof status === "string" && status.toLowerCase().includes("approve");
  useEffect(() => {
    if (isApproved) setApplyBlockedNotApproved(false);
  }, [isApproved]);

  const applyDisabled =
    !applyEnvEnabled || !applyAcknowledged || (applyBlockedNotApproved && !isApproved) || loadingAction === "apply";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Deploy Run</h1>
            <div className="text-xs text-[color:var(--muted)] break-all">RUN_ID: {runId}</div>
          </div>
          <StageTimeline current={status} />
        </div>
      </header>

      {!applyEnvEnabled && (
        <div className="rounded-md border border-[color:var(--warning,#f59e0b)] bg-[color:var(--warning-bg,rgba(245,158,11,0.12))] px-3 py-2 text-xs text-[color:var(--warning-text,#b45309)]">
          Apply is disabled by default. Set NEXT_PUBLIC_ENABLE_INFRA_APPLY=true in .env.local and restart to enable.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-3 py-2 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Status</div>
            <div className="text-xs text-[color:var(--muted)]">Pipeline: {refresh?.pipeline?.state || "n/a"}</div>
          </div>
          <Button variant="outline" onClick={poll}>
            Refresh
          </Button>
        </div>
        <div className="text-sm text-[color:var(--fg)]">Current: {status}</div>
        {refresh?.pipeline?.url && (
          <a className="text-xs text-[color:var(--accent)] underline" href={refresh.pipeline.url} target="_blank">
            View pipeline
          </a>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Actions</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={approve} disabled={loadingAction === "approve"}>
            {loadingAction === "approve" ? "Approving…" : "Approve deploy"}
          </Button>
          <Button variant="primary" onClick={apply} disabled={applyDisabled}>
            {loadingAction === "apply" ? "Applying…" : "Apply deploy"}
          </Button>
          <Button variant="outline" onClick={loadPackage} disabled={loadingAction === "package"}>
            {loadingAction === "package" ? "Loading…" : "Load package"}
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
          <input
            type="checkbox"
            checked={applyAcknowledged}
            onChange={(e) => setApplyAcknowledged(e.target.checked)}
          />
          I understand this will create/modify Azure resources
        </label>
        {applyBlockedNotApproved && (
          <div className="text-xs text-[color:var(--danger)]">
            Apply blocked: run not approved yet. Approve first.
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Package</div>
        {packageData ? (
          <div className="space-y-2">
            <div className="text-xs text-[color:var(--muted)]">
              Package: {packageData.package_id || "n/a"} | RS: {packageData.requirement_set_id} v
              {packageData.requirement_set_version}
            </div>
            <JsonViewer data={packageData.manifest_json || packageData} />
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">No package loaded.</div>
        )}
      </Card>
    </div>
  );
}
