"use client";

import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import DeploymentTimeline from "@/components/onboarding/DeploymentTimeline";


export default function DeploymentsPage() {
  const { session, loading, error } = useOnboardingSession();

  return (
    <ConsoleShell
      title="Deployment Dashboard"
      subtitle="View pipeline runs for the current onboarding session."
    >
      {loading && <p className="text-sm text-gray-500">Loading session…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!session && !loading && !error && (
        <p className="text-sm text-gray-500">
          No current session. Start an AI or Manual onboarding flow first.
        </p>
      )}
      {session && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Session: <span className="font-mono">{session.session_id}</span>
          </p>
          <DeploymentTimeline runs={session.runs || []} />
        </div>
      )}
    </ConsoleShell>
  );
}
