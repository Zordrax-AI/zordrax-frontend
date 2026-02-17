"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRunStatus } from "@/lib/useRunStatus";
import { client } from "@/lib/agent";
import { getRequirementSetId } from "@/lib/wizard";

export const dynamic = "force-dynamic";

export default function RunPage() {
  const params = useSearchParams();
  const router = useRouter();
  const requirementSetId = getRequirementSetId(params) ?? "";
  const runId = params.get("run_id") || params.get("runId") || "";

  const { data, error } = useRunStatus(runId || undefined, 2500);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const lastIdRef = useRef<string | number | undefined>(undefined);

  // events polling
  useEffect(() => {
    if (!runId) return;
    let stop = false;
    async function loadEvents() {
      try {
        const res = await client.getRunEvents(runId, lastIdRef.current);
        if (stop || !res) return;
        const list = Array.isArray(res) ? res : (res.events as any[]) || [];
        if (list.length) {
          lastIdRef.current = list[list.length - 1]?.id ?? lastIdRef.current;
          setEvents((prev) => [...prev, ...list]);
        }
      } catch {
        /* ignore */
      }
    }
    loadEvents();
    const t = setInterval(loadEvents, 2000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [runId]);

  if (!runId) {
    return (
      <div className="space-y-4 text-[color:var(--fg)]">
        <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-4 py-3 text-sm text-[color:var(--danger)]">
          run_id missing. Generate a plan first.
        </div>
        <Button
          variant="primary"
          onClick={() =>
            router.push(
              requirementSetId
                ? `/portal/onboarding/mozart/deploy?requirement_set_id=${encodeURIComponent(requirementSetId)}`
                : "/portal/onboarding/mozart/deploy"
            )
          }
        >
          Go to Deploy
        </Button>
      </div>
    );
  }

  const status = data?.current_status || data?.status || "unknown";
  const events = data?.events || [];

  async function refreshOnce() {
    if (!runId) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      await client.getRunStatus(runId);
    } catch (e: any) {
      setRefreshError(e?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function approve() {
    if (!runId) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      await client.approveRun(runId);
    } catch (e: any) {
      setRefreshError(e?.message || "Approve failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function apply() {
    if (!runId) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      await client.applyRun(runId);
    } catch (e: any) {
      setRefreshError(e?.message || "Apply failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Run Timeline</div>
          <div className="text-2xl font-semibold text-slate-900">Deployment status</div>
          <div className="text-sm text-slate-600">
            run_id: <span className="font-mono text-slate-800">{runId}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {requirementSetId ? (
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/portal/onboarding/mozart/recommendations?requirement_set_id=${encodeURIComponent(
                    requirementSetId
                  )}&run_id=${encodeURIComponent(runId)}`
                )
              }
            >
              View Recommendations
            </Button>
          ) : null}
          <Button variant="outline" onClick={refreshOnce} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={approve} disabled={refreshing}>
            Approve
          </Button>
          <Button variant="outline" onClick={apply} disabled={refreshing}>
            Apply
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      )}
      {refreshError && (
        <div className="rounded-md border border-[color:var(--warning,#f59e0b)] bg-[color:var(--warning-bg,rgba(245,158,11,0.12))] px-4 py-3 text-sm text-[color:var(--warning-text,#b45309)]">
          {refreshError}
        </div>
      )}

      <Card className="p-4 space-y-3 bg-white border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-800">
          <span className="font-semibold">Current status:</span>
          <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs uppercase">{status}</span>
        </div>

        <div className="text-xs text-slate-600">Polling every ~2s until a terminal status is reached.</div>

        <div className="space-y-2">
          {events.length === 0 && <div className="text-sm text-slate-500">No events yet.</div>}
          {events.map((e, idx) => (
            <div key={`${e.id || e.created_at || e.ts || idx}`} className="rounded border border-slate-200 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-900">
                <span className="font-mono text-xs text-slate-600">
                  {(e.created_at || e.ts || "").toString().replace("T", " ").replace("Z", "") || "pending"}
                </span>
                <span className="uppercase text-[10px] tracking-wide text-slate-500">{e.stage || "stage"}</span>
                <span className="rounded-full bg-slate-900 text-white px-2 py-0.5 text-[10px] uppercase">
                  {e.status || "status"}
                </span>
                <span className="ml-auto text-xs text-slate-600">#{idx + 1}</span>
              </div>
              {e.message ? <div className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{e.message}</div> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
