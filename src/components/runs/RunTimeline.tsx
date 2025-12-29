// src/components/runs/RunTimeline.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type RunEvent = {
  id: number;
  level: string;
  stage: string;
  status: string;
  message: string;
  created_at: string;
};

export function RunTimeline({ runId }: { runId: string }) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const lastId = useRef<number>(0);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

    if (!base) {
      console.error("NEXT_PUBLIC_ONBOARDING_API_URL is missing");
      return;
    }

    // Initial fetch
    fetch(`${base}/api/runs/${runId}/events`)
      .then((r) => r.json())
      .then((data: RunEvent[]) => {
        setEvents(data);
        if (data.length) {
          lastId.current = data[data.length - 1].id;
        }
      });

    // SSE stream
    const es = new EventSource(
      `${base}/api/runs/${runId}/events/stream?after_id=${lastId.current}`
    );

    es.addEventListener("run_event", (e) => {
      const data: RunEvent = JSON.parse(e.data);
      lastId.current = data.id;
      setEvents((prev) => [...prev, data]);
    });

    es.onerror = (err) => {
      console.error("SSE error", err);
      es.close();
    };

    return () => es.close();
  }, [runId]);

  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="rounded border border-slate-800 p-3">
          <div className="text-xs opacity-70">
            {e.stage} • {e.status}
          </div>
          <div className="text-sm">{e.message}</div>
        </div>
      ))}
    </div>
  );
}
