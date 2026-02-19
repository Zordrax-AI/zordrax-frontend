"use client";

import { useEffect, useRef, useState } from "react";
import { client, RunEvent, RunOutputs } from "./agent";

export type RunStatusState = {
  outputs: RunOutputs | null;
  events: RunEvent[];
};

const TERMINAL = new Set(["infra_succeeded", "infra_failed", "failed", "succeeded"]);

export function useRunStatus(runId?: string | null, intervalMs = 2000) {
  const [data, setData] = useState<RunStatusState>({ outputs: null, events: [] });
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<NodeJS.Timeout | null>(null);
  const lastEventId = useRef<number>(0);

  useEffect(() => {
    if (!runId) return;

    let stop = false;
    const id = runId;

    async function tick() {
      try {
        // 1) outputs (canonical status)
        const outputs = await client.getRunOutputs(id);
        if (stop) return;

        // 2) events (incremental)
        const afterId = lastEventId.current || 0;
        const newEvents = await client.getRunEvents(id, afterId);
        if (stop) return;

        if (newEvents.length) {
          lastEventId.current = newEvents[newEvents.length - 1].id;
        }

        setData((prev) => ({
          outputs,
          events: newEvents.length ? [...prev.events, ...newEvents] : prev.events,
        }));

        const st = (outputs.status || "").toLowerCase();
        if (st && TERMINAL.has(st)) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
        }

        setError(null);
      } catch (e: any) {
        if (stop) return;
        setError(e?.message || "Failed to fetch run status");
      }
    }

    // reset when run changes
    lastEventId.current = 0;
    setData({ outputs: null, events: [] });
    setError(null);

    tick();
    timer.current = setInterval(tick, intervalMs);

    return () => {
      stop = true;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [runId, intervalMs]);

  return { data, error };
}