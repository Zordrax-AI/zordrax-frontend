"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getRunEvents, RunEvent } from "@/lib/api";

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [events, setEvents] = useState<RunEvent[]>([]);
  const [lastId, setLastId] = useState(0);

  useEffect(() => {
    if (!runId) return;

    const i = setInterval(async () => {
      const e = await getRunEvents(runId, lastId);
      if (e.length) {
        setEvents((p) => [...p, ...e]);
        setLastId(e[e.length - 1].event_id);
      }
    }, 2000);

    return () => clearInterval(i);
  }, [runId, lastId]);

  return (
    <div className="font-mono text-sm space-y-1">
      {events.map((e) => (
        <div key={e.event_id}>
          [{e.stage}] {e.message}
        </div>
      ))}
    </div>
  );
}
