"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";

import { stageLabel, stageProgress } from "@/lib/runStages";

type Run = {
  id: string;
  title: string;
  mode: string;
  status: string;
  stage: string;
};

type Event = {
  event_id?: number;
  message?: string;
  stage?: string;
  status?: string;
  heartbeat?: boolean;
};

const API = process.env.NEXT_PUBLIC_AGENT_BASE_URL;

function tone(status?: string) {
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "warning";
  return "default";
}

export default function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // Fetch run summary
  useEffect(() => {
    if (!runId) return;
    fetch(`${API}/api/runs/${runId}`)
      .then((r) => r.json())
      .then(setRun);
  }, [runId]);

  // SSE stream
  useEffect(() => {
    if (!runId) return;

    const es = new EventSource(`${API}/api/runs/${runId}/events`);

    es.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (!data.heartbeat) {
        setEvents((prev) => [...prev, data]);
        if (data.stage && data.status) {
          setRun((r) =>
            r ? { ...r, stage: data.stage!, status: data.status! } : r
          );
        }
      }
    };

    return () => es.close();
  }, [runId]);

  if (!runId) return <div className="p-6">Missing run ID.</div>;
  if (!run) return null;

  const progress = stageProgress(run.stage);

  async function cancelRun() {
    await fetch(`${API}/api/runs/${runId}/cancel`, { method: "POST" });
  }

  async function retryRun() {
    await fetch(`${API}/api/runs/${runId}/retry`, { method: "POST" });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-xl font-semibold">{run.title}</h1>
          <p className="text-xs text-slate-400">{run.id}</p>
        </div>
        <Badge tone={tone(run.status)}>{run.status}</Badge>
      </div>

      {/* Progress */}
      <Card>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{stageLabel(run.stage)}</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </Card>

      {/* Controls */}
      <Card>
        <div className="flex gap-3">
          {(run.status === "running" || run.stage === "queued") && (
            <button
              onClick={cancelRun}
              className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
            >
              Cancel run
            </button>
          )}

          {run.status === "failed" && (
            <button
              onClick={retryRun}
              className="rounded bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700"
            >
              Retry
            </button>
          )}
        </div>
      </Card>

      {/* Logs */}
      <Card>
        <div className="h-80 overflow-y-auto bg-black rounded p-3 font-mono text-xs text-green-400">
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
