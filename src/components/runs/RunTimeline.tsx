// src/components/runs/RunTimeline.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getRunEvents, RunEvent } from "@/lib/api";

export function RunTimeline({ runId }: { runId: string }) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastIdRef = useRef<number>(0);

  useEffect(() => {
    let alive = true;

    async function firstLoad() {
      try {
        const es = await getRunEvents(runId, 0);
        if (!alive) return;
        setEvents(es);
        lastIdRef.current = es.length ? es[es.length - 1].id : 0;
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load events");
      }
    }

    firstLoad();
    return () => {
      alive = false;
    };
  }, [runId]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const es = await getRunEvents(runId, lastIdRef.current);
        if (es?.length) {
          setEvents((prev) => [...prev, ...es]);
          lastIdRef.current = es[es.length - 1].id;
        }
      } catch {
        // ignore polling failures
      }
    }, 1500);

    return () => clearInterval(t);
  }, [runId]);

  return (
    <div className="space-y-3">
      <div className="text-sm opacity-80">Event timeline</div>

      {error && (
        <div className="rounded border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-100">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-sm opacity-70">No events yet.</div>
      ) : (
        <div className="space-y-2">
          {events.slice(-200).map((e) => (
            <div
              key={e.id}
              className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="opacity-70">
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="opacity-80">
                  {e.stage} • {e.status} • {e.level}
                </div>
              </div>
              <div className="mt-1">{e.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RunTimeline;
