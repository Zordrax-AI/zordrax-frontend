export const dynamic = "force-dynamic";

"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";

function StatusFallback() {
  return (
    <div className="p-6 flex items-center gap-2">
      <Spinner /> Loading run status…
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<StatusFallback />}>
      <StatusClient />
    </Suspense>
  );
}

/* ---------------- CLIENT COMPONENT ---------------- */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
  message?: string;
  stage?: string;
  status?: string;
  heartbeat?: boolean;
};

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

function tone(status?: string) {
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "warning";
  return "default";
}

function StatusClient() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // fetch run summary
  useEffect(() => {
    if (!runId) return;
    fetch(`${API}/api/runs/${runId}`)
      .then((r) => r.json())
      .then(setRun);
  }, [runId]);

  // SSE
  useEffect(() => {
    if (!runId) return;
    const es = new EventSource(`${API}/api/runs/${runId}/events`);
    es.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (!data.heartbeat) {
        setEvents((prev) => [...prev, data]);
        if (data.stage && data.status) {
          setRun((r) => (r ? { ...r, stage: data.stage, status: data.status } : r));
        }
      }
    };
    return () => es.close();
  }, [runId]);

  if (!runId) return <div className="p-6">Missing run ID.</div>;
  if (!run) return <StatusFallback />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-xl font-semibold">{run.title}</h1>
          <p className="text-xs text-slate-400">{run.id}</p>
        </div>
        <Badge tone={tone(run.status)}>{run.status}</Badge>
      </div>

      <Card>
        <div className="text-sm">
          Stage: <b>{run.stage}</b>
        </div>
      </Card>

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
