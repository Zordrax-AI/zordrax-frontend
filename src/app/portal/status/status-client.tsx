"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getEventsUrl, getRunStatus, type ZordraxRun } from "@/lib/agent";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

type SseEvent = {
  event_id?: number;
  run_id?: string;
  ts?: number;
  level?: string;
  message?: string;
  stage?: string | null;
  status?: string | null;
};

function tone(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "success";
  if (s === "failed") return "error";
  if (s === "running") return "warning";
  if (s === "queued") return "default";
  return "default";
}

function fmtTs(ms?: number) {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [run, setRun] = useState<ZordraxRun | null>(null);
  const [events, setEvents] = useState<SseEvent[]>([]);
  const [phase, setPhase] = useState<"init" | "connecting" | "streaming" | "done" | "error">("init");
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const closedRef = useRef(false);

  const derived = useMemo(() => {
    const status = run?.status || "queued";
    const stage = run?.stage || "queued";
    const last = events.length ? events[events.length - 1] : null;
    return {
      status,
      stage,
      lastMessage: last?.message || "",
      lastLevel: last?.level || "",
      lastTs: last?.ts,
    };
  }, [run, events]);

  // 1) Load initial run status (optimistic state)
  useEffect(() => {
    if (!runId) {
      setError("Missing run id. Open this page using /portal/status?run=<id>");
      setPhase("error");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setPhase("connecting");
        const r = await getRunStatus(runId);
        if (!cancelled) setRun(r);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to fetch run status");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId]);

  // 2) Start SSE streaming + safe reconnect behavior
  useEffect(() => {
    if (!runId) return;

    closedRef.current = false;
    setError(null);

    const url = getEventsUrl(runId);

    // close existing
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {}
      esRef.current = null;
    }

    const es = new EventSource(url);
    esRef.current = es;

    setPhase("streaming");

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as SseEvent;

        setEvents((prev) => {
          // de-dup if reconnect replays last chunk
          const lastId = prev.length ? prev[prev.length - 1].event_id : undefined;
          if (data.event_id && lastId && data.event_id <= lastId) return prev;
          return [...prev, data].slice(-500); // keep last 500 events
        });

        // Update optimistic run state based on event payload (if provided)
        if (data.status || data.stage) {
          setRun((prev) => {
            const base = prev || ({
              id: runId,
              mode: "unknown",
              title: "Run",
              status: "queued",
              stage: "queued",
              created_at: Date.now(),
              updated_at: Date.now(),
            } as ZordraxRun);

            return {
              ...base,
              status: data.status ?? base.status,
              stage: data.stage ?? base.stage,
              updated_at: Date.now(),
            };
          });
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = async () => {
      if (closedRef.current) return;

      // EventSource will auto-retry; we just reflect state + refresh status
      setPhase("connecting");

      try {
        const r = await getRunStatus(runId);
        setRun(r);

        const st = (r.status || "").toLowerCase();
        if (st === "completed" || st === "failed") {
          setPhase("done");
          try {
            es.close();
          } catch {}
          esRef.current = null;
          closedRef.current = true;
        } else {
          setPhase("streaming");
        }
      } catch (e: any) {
        setError(e?.message || "SSE disconnected and status refresh failed");
        setPhase("error");
      }
    };

    return () => {
      closedRef.current = true;
      try {
        es.close();
      } catch {}
      esRef.current = null;
    };
  }, [runId]);

  if (!runId) {
    return (
      <div className="p-6">
        <Card>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold">Run Status</h1>
            <p className="text-sm text-slate-400">
              Missing run id. Use <code className="text-slate-200">/portal/status?run=&lt;id&gt;</code>.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const s = (derived.status || "").toLowerCase();
  const finished = s === "completed" || s === "failed";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Run Status</h1>
          <p className="text-xs text-slate-500 break-all">{runId}</p>
        </div>

        <div className="flex items-center gap-2">
          {phase === "connecting" ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner /> Connecting…
            </div>
          ) : phase === "streaming" ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Live
            </div>
          ) : phase === "done" ? (
            <div className="text-xs text-slate-400">Finished</div>
          ) : phase === "error" ? (
            <div className="text-xs text-red-300">Error</div>
          ) : null}
        </div>
      </div>

      {error ? (
        <Card>
          <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
            <div className="mt-2 text-xs text-red-200/80">
              Check: CORS_ALLOW_ORIGINS on backend + NEXT_PUBLIC_API_BASE_URL on Vercel.
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs text-slate-400">Status</p>
          <div className="mt-2">
            <Badge tone={tone(derived.status)}>{derived.status}</Badge>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Stage</p>
          <p className="mt-2 text-sm">{derived.stage}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Last update</p>
          <p className="mt-2 text-sm text-slate-300">{fmtTs(derived.lastTs)}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Live Events</h2>
          <div className="text-xs text-slate-500">{events.length} events</div>
        </div>

        {finished ? (
          <div className="mt-3 text-xs text-slate-400">
            Run finished ({derived.status}). Stream will stop automatically.
          </div>
        ) : null}

        <div className="mt-4 space-y-2 max-h-[420px] overflow-auto pr-2">
          {events.length === 0 ? (
            <div className="text-sm text-slate-400">
              Waiting for events…
            </div>
          ) : (
            events.map((e) => (
              <div
                key={e.event_id ?? `${e.ts}-${e.message}`}
                className="rounded-md border border-slate-900 bg-slate-950/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {fmtTs(e.ts)} {e.stage ? `· ${e.stage}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {e.level ?? "info"}
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">
                  {e.message}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
