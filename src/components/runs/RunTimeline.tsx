"use client";

import { useEffect, useState } from "react";
import { getRunEvents, type RunEvent } from "@/lib/api";

type Props = {
  runId: string;
};

export function RunTimeline({ runId }: Props) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let afterId = 0;

    async function tick() {
      try {
        const next = await getRunEvents(runId, afterId);
        if (!alive) return;

        if (next.length) {
          afterId = next[next.length - 1].id;
          setEvents((prev) => [...prev, ...next]);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load events");
      }
    }

    tick();
    const t = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [runId]);

  return (
    <div className="space-y-3">
      {err && (
        <div className="rounded border border-red-700 bg-red-950/40 p-2 text-xs text-red-200">
          {err}
        </div>
      )}

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-sm text-slate-400">No events yet.</div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="rounded border border-slate-800 bg-slate-950/40 p-2 text-xs text-slate-200"
            >
              <div className="flex flex-wrap gap-2 text-slate-400">
                <span className="font-mono">#{e.id}</span>
                <span>{e.level}</span>
                <span>{e.stage}</span>
                <span>{e.status}</span>
                <span className="ml-auto">{new Date(e.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1 whitespace-pre-wrap">{e.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Support both import styles:
export default RunTimeline;
