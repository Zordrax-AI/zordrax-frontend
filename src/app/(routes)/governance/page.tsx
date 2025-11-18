"use client";

import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { GovernanceResultPanel } from "@/components/GovernanceResultPanel";


export default function GovernancePage() {
  const { sessionId, loading, error } = useOnboardingSession();

  return (
    <ConsoleShell
      title="Governance Validation"
      subtitle="View data quality, schema, and reconciliation checks for your current session."
    >
      {loading && <p className="text-sm text-gray-500">Loading session…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!sessionId && !loading && (
        <p className="text-sm text-gray-500">
          No current session selected. Start an AI or Manual onboarding flow first.
        </p>
      )}
      {sessionId && <GovernanceResultPanel sessionId={sessionId} />}
    </ConsoleShell>
  );
}