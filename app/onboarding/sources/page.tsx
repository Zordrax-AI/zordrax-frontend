'use client';
import { useEffect, useState } from 'react';

const API = "/api/onboarding/api";

export default function Page() {
  const [reqId, setReqId] = useState<string | null>(null);
  const [sources, setSources] = useState({ bucket_url: "", db_dsn: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem("requirement_set_id");
    if (existing) {
      setReqId(existing);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API}/requirement-sets`, { method: "POST" });
        const json = await res.json();
        const id = json.requirement_set_id || json.id;
        if (!id) throw new Error("no requirement_set_id in response");
        localStorage.setItem("requirement_set_id", id);
        setReqId(id);
        setError(null);
      } catch (e: any) {
        setError(String(e?.message || e));
      }
    })();
  }, []);

  const save = async () => {
    if (!reqId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/requirement-sets/${reqId}/sources`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sources),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Onboarding - Sources</h1>
      <p>Requirement Set: {reqId || "creating..."}</p>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      <label style={{ display: "block", marginBottom: 8 }}>
        Bucket URL
        <input
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          value={sources.bucket_url}
          onChange={(e) => setSources({ ...sources, bucket_url: e.target.value })}
          placeholder="s3://data-bucket"
        />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Database DSN
        <input
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          value={sources.db_dsn}
          onChange={(e) => setSources({ ...sources, db_dsn: e.target.value })}
          placeholder="postgres://user:pass@host/db"
        />
      </label>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button onClick={save} disabled={!reqId || saving} style={{ padding: "10px 16px" }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <a
          href="/onboarding/requirements"
          style={{
            padding: "10px 14px",
            border: "1px solid #444",
            textDecoration: "none",
            pointerEvents: reqId ? "auto" : "none",
            opacity: reqId ? 1 : 0.4,
          }}
        >
          Next
        </a>
      </div>
    </main>
  );
}
