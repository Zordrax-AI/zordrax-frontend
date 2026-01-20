// src/app/portal/status/status-client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  cancelRun,
  getInfraOutputs,
  getRun,
  getRunEvents,
  InfraOutputsResponse,
  RunEvent,
  RunRow,
} from "@/lib/api";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function StatusClient() {
  const sp = useSearchParams();

  // support multiple param keys so old links still work
  const runId = useMemo(() => {
    return (
      sp.get("run") ||
      sp.get("run_id") ||
      sp.get("id") ||
      sp.get("runId") ||
      null
    );
  }, [sp]);

  const [run, setRun] = useState<RunRow | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [outputs, setOutputs] = useState<InfraOutputsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyCancel, setBusyCancel] = useState(false);

  const lastEventIdRef = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    if (!runId) return;

    const rid = runId; // <-- TS narrowing

    async function bootstrap() {
      try {
        const r = await getRun(rid);
        if (!alive) return;
        setRun(r);

        const es = await getRunEvents(rid, 0);
        if (!alive) return;
        setEvents(es);
        lastEventIdRef.current = es.length ? es[es.length - 1].id : 0;

        const out = await getInfraOutputs(rid);
        if (!alive) return;
        setOutputs(out);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load run status");
      }
    }

    bootstrap();
    return () => {
      alive = false;
    };
  }, [runId]);

  // Poll for new events + run status + outputs
  useEffect(() => {
    if (!runId) return;
    const rid = runId;

    const t = setInterval(async () => {
      try {
        const [r, newEvents, out] = await Promise.all([
          getRun(rid),
          getRunEvents(rid, lastEventIdRef.current),
          getInfraOutputs(rid),
        ]);

        setRun(r);

        if (newEvents?.length) {
          setEvents((prev) => [...prev, ...newEvents]);
          lastEventIdRef.current = newEvents[newEvents.length - 1].id;
        }

        setOutputs(out);
      } catch {
        // ignore transient polling errors
      }
    }, 2000);

    return () => clearInterval(t);
  }, [runId]);

  async function onCancel() {
    if (!runId) return;
    const rid = runId;

    setBusyCancel(true);
    setError(null);
    try {
      await cancelRun(rid);
    } catch (e: any) {
      setError(e?.message ?? "Cancel failed");
    } finally {
      setBusyCancel(false);
    }
  }

  if (!runId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-lg border border-white/10 p-4">
          <div className="opacity-80">
            No run id provided. Open a status page like:
          </div>
          <pre className="mt-2 text-sm bg-black/30 p-3 rounded">
            /portal/status?run=&lt;uuid&gt;
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Run Status</h1>
          <div className="mt-1 text-sm opacity-80">{runId}</div>

          {run && (
            <div className="mt-2 text-sm">
              <span className="opacity-70">Status:</span>{" "}
              <span className="font-medium">{run.status}</span>
              <span className="opacity-70"> • Stage:</span>{" "}
              <span className="font-medium">{run.stage}</span>
              <span className="opacity-70"> • Region:</span>{" "}
              <span className="font-medium">{run.deploy?.region ?? "-"}</span>
              <span className="opacity-70"> • Env:</span>{" "}
              <span className="font-medium">{run.deploy?.environment ?? "-"}</span>
            </div>
          )}
        </div>

        <button
          onClick={onCancel}
          disabled={busyCancel}
          className={classNames(
            "px-4 py-2 rounded border",
            "border-red-400/40 text-red-200 hover:bg-red-500/10",
            busyCancel && "opacity-60 cursor-not-allowed"
          )}
        >
          {busyCancel ? "Cancelling..." : "Cancel Run"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-red-100">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="text-lg font-semibold mb-3">Event Log</h2>
        {events.length === 0 ? (
          <div className="text-sm opacity-70">No events yet.</div>
        ) : (
          <div className="space-y-2">
            {events.slice(-200).map((e) => (
              <div
                key={e.id}
                className="text-sm rounded border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="opacity-70">
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                  <div className="opacity-80">
                    {e.stage} • {e.status}
                  </div>
                </div>
                <div className="mt-1">{e.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="text-lg font-semibold mb-3">Terraform Outputs</h2>
        {!outputs?.found ? (
          <div className="text-sm opacity-70">No outputs found yet.</div>
        ) : (
          <pre className="text-xs bg-black/30 p-3 rounded overflow-auto">
            {JSON.stringify(outputs, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
