"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSessions, SessionSummary } from "@/lib/onboardingConsoleApi";
import { SessionBadge } from "./SessionBadge";

export function SessionHistoryTable() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSessions()
      .then((data) => {
        setSessions(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load sessions";
        setError(message || "Failed to load sessions");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading history…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!sessions.length) {
    return <p className="text-sm text-gray-500">No sessions yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Session
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Project
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Env
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((s) => (
            <tr key={s.session_id}>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">
                {s.session_id}
              </td>
              <td className="px-3 py-2 text-gray-800">{s.project_name}</td>
              <td className="px-3 py-2 text-gray-600">{s.environment}</td>
              <td className="px-3 py-2">
                <SessionBadge status={s.status} />
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/sessions/${encodeURIComponent(s.session_id)}`}
                  className="text-xs font-semibold text-blue-600 underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
