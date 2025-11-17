"use client";

import { useParams } from "next/navigation";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { ManifestDiffViewer } from "@/components/onboarding/ManifestDiffViewer";
import { GovernanceResultPanel } from "@/components/onboarding/GovernanceResultPanel";
import { DeploymentTimeline } from "@/components/onboarding/DeploymentTimeline";
import { RetryButton } from "@/components/onboarding/RetryButton";

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const { session, loading, error } = useOnboardingSession(params.sessionId);

  return (
    <ConsoleShell
      title="Session Detail"
      subtitle="AI, Manual, Governance, and Deployments in a single view."
      actions={session ? <RetryButton sessionId={session.session_id} /> : null}
    >
      {loading && <p className="text-sm text-gray-500">Loading session…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!session && !loading && !error && (
        <p className="text-sm text-gray-500">Session not found.</p>
      )}
      {session && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Manifests
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Compare AI and Manual manifests, and finalize the merged version.
            </p>
            <div className="mt-3">
              <ManifestDiffViewer sessionId={session.session_id} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Governance
            </h2>
            <div className="mt-3">
              <GovernanceResultPanel sessionId={session.session_id} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Deployments
            </h2>
            <div className="mt-3">
              <DeploymentTimeline runs={session.runs || []} />
            </div>
          </section>
        </div>
      )}
    </ConsoleShell>
  );
}
