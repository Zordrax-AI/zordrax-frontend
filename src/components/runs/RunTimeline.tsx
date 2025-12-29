"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RunEvent = {
  id: number;
  level: "info" | "warn" | "error";
  stage: string;
  status: string;
  message: string;
  created_at: string;
};

const STAGE_PROGRESS: Record<string, number> = {
  queued: 0,
  initializing: 5,
  terraform_init: 20,
  terraform_plan: 45,
  terraform_apply: 75,
  completed: 100,
  failed: 100,
  canceled: 100,
  cancel: 5,
};

function Badge({ level }: { level: RunEvent["level"] }) {
  const base = "inline-flex rounded-full px-2 py-0.5 text-xs border";
  const cls =
    level === "error"
      ? "border-rose-500/40 text-rose-300"
      : level === "warn"
      ? "border-amber-500/40 text-amber-300"
      : "border-slate-700 text-slate-300";

  return <span className={`${base} ${cls}`}>{level}</span>;
}

export function RunTimeline({ runId }: { runId: string }) {
  const base = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

  const [events, setEvents] = useState<RunEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const lastId = useRef<number>(0);

  const latest = events.length ? events[events.length - 1] : null;

  const progress = useMemo(() => {
    if (!latest) return 0;
    return STAGE_PROGRESS[latest.stage] ?? 0;
  }, [latest]);

  async function initialLoad() {
    if (!base) return;

    setLoading(true);
    const res = await fetch(`${base}/api/runs/${runId}/events`, {
      cache: "no-store",
    });
    const data: RunEvent[] = await res.json();

    setEvents(data);
    if (data.length) lastId.current = data[data.length - 1].id;
    setLoading(false);
  }

  async function cancelRun() {
    if (!base) return;
    setCanceling(true);
    try {
      await fetch(`${base}/api/runs/${runId}/cancel`, {
        method: "POST",
      });
    } finally {
      setCanceling(false);
    }
  }

  useEffect(() => {
    if (!base) {
      console.error("NEXT_PUBLIC_ONBOARDING_API_URL is missing");
      return;
    }

    // 1) initial fetch
    initialLoad();

    // 2) SSE
    const es = new EventSource(
      `${base}/api/runs/${runId}/events/stream?after_id=${lastId.current}`
    );

    es.addEventListener("run_event", (e) => {
      const ev: RunEvent = JSON.parse((e as MessageEvent).data);
      lastId.current = ev.id;
      setEvents((prev) => [...prev, ev]);
    });

    es.onerror = (err) => {
      console.error("SSE error", err);
      es.close();
    };

    return () => es.close();
  }, [runId]);

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm opacity-80">
          {latest ? (
            <>
              <span className="font-semibold">{latest.stage}</span>
              <span className="opacity-60"> • {latest.status}</span>
            </>
          ) : (
            "No events yet"
          )}
        </div>

        <button
          onClick={cancelRun}
          disabled={canceling || latest?.status === "completed" || latest?.status === "failed" || latest?.status === "canceled"}
          className="rounded border border-amber-500/40 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
        >
          {canceling ? "Canceling..." : "Cancel"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="rounded border border-slate-800 p-3 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs opacity-80">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded bg-slate-800">
          <div
            className="h-2 rounded bg-gradient-to-r from-sky-400 to-violet-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Events */}
      <div className="space-y-2">
        {loading && (
          <div className="text-sm opacity-70">Loading events...</div>
        )}

        {events.map((e) => (
          <div key={e.id} className="rounded border border-slate-800 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs opacity-70">
                {e.stage} • {e.status}
              </div>
              <Badge level={e.level} />
            </div>

            {/* Terraform stdout goes here because backend emits line-by-line */}
            <div className="mt-2 text-sm whitespace-pre-wrap break-words">
              {e.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
