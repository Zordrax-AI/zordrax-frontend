'use client';
import { useEffect, useState } from 'react';

const API = "/api/onboarding/api/marta";
function getReqId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("marta_req_id") : null;
}

export default function Page() {
  const [reqId, setReqId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [busy, setBusy] = useState(false);
  useEffect(() => setReqId(getReqId()), []);

  const act = async (action: "submit" | "approve") => {
    if (!reqId) return;
    setBusy(true);
    await fetch(`${API}/requirement-sets/${reqId}/${action}`, { method: "POST" })
      .then((r) => r.json())
      .then((j) => setStatus(j.status || action))
      .finally(() => setBusy(false));
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Onboarding - Approval</h1>
      <p>Requirement Set: {reqId || "missing (go back)"} </p>
      <p>Status: {status}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/onboarding/recommendations" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Back
        </a>
        <button disabled={!reqId || busy} onClick={() => act("submit")} style={{ padding: "10px 16px" }}>
          Submit
        </button>
        <button disabled={!reqId || busy} onClick={() => act("approve")} style={{ padding: "10px 16px" }}>
          Approve
        </button>
        <a href="/onboarding/plan" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Next
        </a>
      </div>
    </main>
  );
}
