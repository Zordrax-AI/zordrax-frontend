"use client";

import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { ManifestDiffViewer } from "@/components/onboarding/ManifestDiffViewer";

export default function MergePage() {
  const { sessionId, loading, error } = useOnboardingSession();

  return (
    <ConsoleShell
      title="Merge AI & Manual Manifests"
      subtitle="Review and finalize the Terraform + pipeline configuration for this session."
    >
      {loading && <p className="text-sm text-gray-500">Loading session…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!sessionId && !loading && (
        <p className="text-sm text-gray-500">
          No current session. Start from <span className="font-semibold">AI Deploy</span> or{" "}
          <span className="font-semibold">Manual Deploy</span> first.
        </p>
      )}
      {sessionId && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Session: <span className="font-mono">{sessionId}</span>
          </p>
          <ManifestDiffViewer sessionId={sessionId} />
        </div>
      )}
    </ConsoleShell>
  );
}
