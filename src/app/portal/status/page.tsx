"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getEventsUrl, getRunStatus } from "@/lib/agent";
import { loadSessions, upsertSession } from "@/lib/sessions";

type LogEvent = {
  ts?: string;
  level?: "info" | "warn" | "error";
  message: string;
  stage?: string;
  status?: string;
};

export default function StatusPage() {
  const sp = useSearchParams();
  const runId = sp.get("run") || "";

  const [events, setEvents] = useState<LogEvent[]>([]);
  const [state, setState] = useState<{ status?: string; stage?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);

  const title = useMemo(() => {
    const s = loadSessions().find((x) => x.id === runId);
    return s?.title || "Deployment Status";
  }, [runId]);

  useEffect(() => {
    if (!runId) return;

    // 1) initial status pull
    (async () => {
      try {
        const s = await getRunStatus(runId);
        setState({ status: s.status, stage: s.stage });
        upsertSession({
          id: runId,
          created_at: new Date().toISOString(),
          mode: (s.mode as any) || "ai",
          title,
          status: s.status || "unknown",
        });
      } catch {
        // ok if endpoint not ready yet
      }
    })();

    // 2) SSE stream
    try {
      const url = getEventsUrl(runId);
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as LogEvent;
          setEvents((prev) => [...prev, data].slice(-300));

          if (data.status || data.stage) {
            setState((prev) => ({
              status: data.status ?? prev.status,
              stage: data.stage ?? prev.stage,
            }));
          }

          if (data.status) {
            upsertSession({
              id: runId,
              created_at: new Date().toISOString(),
              mode: "ai",
              title,
              status: (data.status as any) || "unknown",
            });
          }
        } catch {
          // ignore malformed lines
        }
      };

      es.onerror = () => {
        setError("Log stream disconnected (SSE). Refresh to retry.");
        es.close();
      };
    } catch (e: any) {
      setError(e?.message || "Unable to open SSE stream");
    }

    return () => {
      esRef.current?.close();
    };
  }, [runId, title]);

  return (
    <>
      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="mt-4 text-sm text-slate-400">
        <div>Run ID: <span className="text-slate-200">{runId || "missing"}</span></div>
        <div>Status: <span className="text-slate-200">{state.status || "unknown"}</span></div>
        <div>Stage: <span className="text-slate-200">{state.stage || "—"}</span></div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-yellow-800 bg-yellow-900/20 p-4 text-sm text-yellow-200">
          {error}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-3 text-sm font-medium text-slate-200">Live logs</div>
        <div className="h-[420px] overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-300">
          {events.length === 0 ? (
            <div className="text-slate-500">Waiting for events…</div>
          ) : (
            events.map((e, i) => (
              <div key={i}>
                {e.ts ? `[${e.ts}] ` : ""}
                {e.level ? `${e.level.toUpperCase()} ` : ""}
                {e.stage ? `(${e.stage}) ` : ""}
                {e.message}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
