"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { fetchSessions } from "@/lib/api";
import type { OnboardingSession } from "@/lib/types";

export default function ListOnboardPage() {
  const [sessions, setSessions] = useState<OnboardingSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Onboarding Sessions</h1>

      <Card>
        {!sessions && !error && (
          <div className="flex items-center gap-2 text-sm">
            <Spinner /> Loading sessions...
          </div>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {sessions && sessions.length === 0 && (
          <p className="text-sm text-slate-400">No onboarding sessions found.</p>
        )}

        {sessions && sessions.length > 0 && (
          <table className="w-full text-xs mt-2">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2 text-left">Project</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Created</th>
              </tr>
            </thead>

            <tbody className="text-slate-200">
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-800">
                  <td className="py-2">{s.project_name}</td>
                  <td className="py-2"><Badge>{s.status}</Badge></td>
                  <td className="py-2">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
