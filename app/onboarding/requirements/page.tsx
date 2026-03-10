'use client';
import { useEffect, useState } from 'react';

const API = "/api/onboarding/api/marta";

function getReqId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("marta_req_id") : null;
}

export default function Page() {
  const [reqId, setReqId] = useState<string | null>(null);
  const [reqs, setReqs] = useState({ sla: "", pii: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const id = getReqId();
    setReqId(id);
  }, []);

  const save = async () => {
    if (!reqId) return;
    setSaving(true);
    await fetch(`${API}/requirement-sets/${reqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirements: reqs }),
    }).finally(() => setSaving(false));
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Onboarding - Requirements</h1>
      <p>Requirement Set: {reqId || "missing (go back)"} </p>
      <label style={{ display: "block", marginBottom: 8 }}>
        SLA (hours)
        <input
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          value={reqs.sla}
          onChange={(e) => setReqs({ ...reqs, sla: e.target.value })}
          placeholder="24"
        />
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={reqs.pii}
          onChange={(e) => setReqs({ ...reqs, pii: e.target.checked })}
          style={{ marginRight: 6 }}
        />
        Contains PII
      </label>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/onboarding/sources" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Back
        </a>
        <button onClick={save} disabled={!reqId || saving} style={{ padding: "10px 16px" }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <a href="/onboarding/recommendations" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Next
        </a>
      </div>
    </main>
  );
}
