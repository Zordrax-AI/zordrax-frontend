"use client";

import { BuildRun } from "@/lib/onboardingConsoleApi";

type DeploymentTimelineProps = {
  runs: BuildRun[];
};

export function DeploymentTimeline({ runs }: DeploymentTimelineProps) {
  if (!runs || !runs.length) {
    return <p className="text-sm text-gray-500">No deployments yet for this session.</p>;
  }

  return (
    <ol className="space-y-3 text-sm">
      {runs.map((run) => (
        <li
          key={run.run_id}
          className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
        >
          <div>
            <p className="font-semibold">
              Run #{run.run_id} · {run.status}
            </p>
            {run.details_url && (
              <a
                href={run.details_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline"
              >
                Open in Azure DevOps
              </a>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {run.started_at || "N/A"} → {run.completed_at || "in progress"}
          </p>
        </li>
      ))}
    </ol>
  );
}
