"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

type Run = {
  id: string;
  title: string;
  mode: string;
  status: string;
  stage: string;
};

type Event = {
  event_id?: number;
  ts?: number;
  level?: string;
  message?: string;
  stage?: string;
  status?: string;
  heartbeat?: boolean;
};

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

function tone(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "success";
  if (s === "failed") return "error";
  if (s === "running") return "warning";
  return "default";
}

export default function RunStatusPage() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [connected, setConnected] = useState(false);

  // Fetch run summary once
  useEffect(() => {
    if (!runId) return;

    fetch(`${API}/api/runs/${runId}`)
      .then((r) => r.json())
      .then(setRun)
      .catch(console.error);
  }, [runId]);

  // SSE stream
  useEffect(() => {
    if (!runId) return;

    const es = new EventSource(`${API}/api/runs/${runId}/events`);

    es.onopen = () => setConnected(true);

    es.onmessage = (evt) => {
      const data: Event = JSON.parse(evt.data);
      if (!data.heartbeat) {
        setEvents((prev) => [...prev, data]);
        if (data.stage && data.status) {
          setRun((r) =>
            r ? { ...r, stage: data.stage!, status: data.status! } : r
          );
        }
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => es.close();
  }, [runId]);

  if (!runId) {
    return <div className="p-6">No run ID provided.</div>;
  }

  if (!run) {
    return (
      <div className="p-6 flex items-center gap-2">
        <Spinner /> Loading run…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{run.title}</h1>
          <p className="text-xs text-slate-400">{run.id}</p>
        </div>
        <Badge tone={tone(run.status)}>{run.status}</Badge>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="text-sm">Current stage:</span>
          <span className="font-mono text-sm">{run.stage}</span>
          {!connected ? (
            <span className="text-xs text-red-400">(disconnected)</span>
          ) : (
            <span className="text-xs text-green-400">(live)</span>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">Execution log</h2>
        <div className="h-80 overflow-y-auto bg-black rounded p-3 font-mono text-xs text-green-400 space-y-1">
          {events.map((e, i) => (
            <div key={i}>
              [{e.stage}] {e.message}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
