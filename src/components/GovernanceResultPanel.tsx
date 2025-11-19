"use client";

import { useEffect, useState } from "react";
import {
  fetchGovernanceResults,
  GovernanceIssue,
  GovernanceSeverity,
} from "@/lib/onboardingConsoleApi";

type GovernanceResultPanelProps = {
  sessionId: string;
};

export function GovernanceResultPanel({ sessionId }: GovernanceResultPanelProps) {
  const [issues, setIssues] = useState<GovernanceIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchGovernanceResults(sessionId);
        if (cancelled) return;
        setIssues(data);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load governance results.";
        setError(message || "Failed to load governance results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) return <p className="text-sm text-gray-500">Checking governance…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!issues.length) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        All checks passed. No governance issues reported for this session.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">
              {issue.type.toUpperCase()} · {issue.dataset || "Unknown dataset"}
            </span>
            <SeverityBadge severity={issue.severity} />
          </div>
          <p className="mt-1 text-xs text-gray-800">{issue.message}</p>
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: GovernanceSeverity }) {
  const label = severity.toUpperCase();
  let classes =
    "rounded-full px-2 py-0.5 text-[10px] font-semibold ";

  if (severity === "high") {
    classes += "bg-red-100 text-red-700";
  } else if (severity === "medium") {
    classes += "bg-amber-100 text-amber-700";
  } else {
    classes += "bg-emerald-100 text-emerald-700";
  }

  return <span className={classes}>{label}</span>;
}
