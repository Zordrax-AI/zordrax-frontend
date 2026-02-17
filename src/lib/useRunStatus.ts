"use client";

import { useEffect, useRef, useState } from "react";
import { client } from "./agent";

export type RunStatus = {
  current_status?: string;
  status?: string;
  events?: { ts?: string; created_at?: string; stage?: string; status?: string; message?: string }[];
};

const TERMINAL = new Set(["infra_succeeded", "infra_failed", "failed", "succeeded"]);

export function useRunStatus(runId?: string | null, intervalMs = 2000) {
  const [data, setData] = useState<RunStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!runId) return;
    const id = runId;
    let stop = false;

    async function tick() {
      try {
        const res = await client.getRunStatus(id);
        if (stop) return;
        setData(res);
        const st = res.current_status || res.status;
        if (st && TERMINAL.has(st.toLowerCase())) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
        }
      } catch (e: any) {
        if (stop) return;
        setError(e?.message || "Failed to fetch status");
      }
    }

    tick();
    timer.current = setInterval(tick, intervalMs);
    return () => {
      stop = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [runId, intervalMs]);

  return { data, error };
}
