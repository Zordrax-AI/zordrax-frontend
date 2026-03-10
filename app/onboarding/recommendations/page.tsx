'use client';
import { useEffect, useState } from 'react';

const API = "/api/onboarding/api/marta";
function getReqId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("marta_req_id") : null;
}

export default function Page() {
  const [reqId, setReqId] = useState<string | null>(null);
  const [note, setNote] = useState("Use Bronze/Silver/Gold zones with daily refresh.");
  const [saving, setSaving] = useState(false);
  useEffect(() => setReqId(getReqId()), []);

  const save = async () => {
    if (!reqId) return;
    setSaving(true);
    await fetch(`${API}/requirement-sets/${reqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendations: { note } }),
    }).finally(() => setSaving(false));
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Onboarding - Recommendations</h1>
      <p>Requirement Set: {reqId || "missing (go back)"} </p>
      <textarea
        style={{ width: "100%", minHeight: 120, padding: 10 }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/onboarding/requirements" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Back
        </a>
        <button onClick={save} disabled={!reqId || saving} style={{ padding: "10px 16px" }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <a href="/onboarding/approval" style={{ padding: "10px 14px", border: "1px solid #444", textDecoration: "none" }}>
          Next
        </a>
      </div>
    </main>
  );
}
