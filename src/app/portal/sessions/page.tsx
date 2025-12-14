"use client";

import { useEffect, useState } from "react";
import { loadSessions } from "@/lib/sessions";

export default function SessionsPage() {
  const [sessions, setSessions] = useState(loadSessions());

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  return (
    <>
      <h1 className="text-xl font-semibold">Sessions</h1>
      <p className="mt-2 text-slate-400 text-sm">Recent onboarding runs stored locally.</p>

      <div className="mt-6 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-slate-500">No sessions yet.</div>
        ) : (
          sessions.map((s) => (
            <a
              key={s.id}
              href={`/portal/status?run=${encodeURIComponent(s.id)}`}
              className="block rounded border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-900"
            >
              <div className="flex justify-between">
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-slate-400">{s.status}</div>
              </div>
              <div className="mt-1 text-xs text-slate-500">{s.created_at}</div>
              <div className="mt-1 text-xs text-slate-500">Run: {s.id}</div>
            </a>
          ))
        )}
      </div>
    </>
  );
}
