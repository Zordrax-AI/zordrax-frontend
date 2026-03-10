'use client';
import { useEffect, useRef, useState } from 'react';

const API = "/api/onboarding/api/marta";

function getReqId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("marta_req_id") : null;
}

export default function Page() {
  const [reqId, setReqId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const pollRef = useRef<any>(null);

  useEffect(() => {
    setReqId(getReqId());
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const startRun = async () => {
    const id = getReqId();
    if (!id) return;
    setStatus("starting");
    const r = await fetch(`${API}/requirement-sets/${id}/run`, { method: "POST" }).then((x) => x.json());
    const rid = r.run_id;
    setRunId(rid);
    setStatus(r.status || "running");
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8010/api/runs/${rid}`);
        const json = await res.json();
        const st = json.status || json.state || "unknown";
        setStatus(st);
        if (st === "succeeded" || st === "failed") {
          clearInterval(timer);
        }
      } catch (e) {
        // ignore
      }
    }, 3000);
    pollRef.current = timer;
  };

  const isRunning = status === "running" || status === "starting";

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Onboarding - Plan</h1>
      <p>Requirement Set: {reqId || "missing (go back)"} </p>
      <p>Run: {runId || "-"} Status: {status}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/onboarding/approval" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Back
        </a>
        <button onClick={startRun} disabled={!reqId || isRunning} style={{ padding: "10px 16px" }}>
          {isRunning ? "Running..." : "Generate Plan"}
        </button>
        {runId ? (
          <a href={`/portal/runs/${runId}`} style={{ padding: "10px 14px", textDecoration: "none" }}>
            View Run
          </a>
        ) : null}
      </div>
    </main>
  );
}
