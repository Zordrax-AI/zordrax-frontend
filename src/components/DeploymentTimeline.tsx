"use client";

import { useEffect, useState } from "react";

type TimelineStep = {
  name: string;
  status: string;
  result?: string | null;
  duration?: number;
};

type TimelineResponse = {
  project: string;
  pipeline_run_id: number | null;
  timeline: TimelineStep[];
  pipeline?: {
    _links?: {
      web?: {
        href?: string;
      };
    };
  };
};

type DeploymentTimelineProps = {
  project: string;
};

export function DeploymentTimeline({ project }: DeploymentTimelineProps) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll timeline API every 5s
  useEffect(() => {
    async function fetchTimeline() {
      const res = await fetch(`/api/onboarding/timeline/${project}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }

    fetchTimeline();
    const interval = setInterval(fetchTimeline, 5000);
    return () => clearInterval(interval);
  }, [project]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading deployment timeline...</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-600">No timeline data available.</p>;
  }

  const devopsUrl = data.pipeline?._links?.web?.href;

  return (
    <div className="space-y-4">
      <h2 className="text-md font-semibold">
        Deployment Timeline · {data.project}
      </h2>

      {devopsUrl && (
        <a
          href={devopsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 underline"
        >
          Open Pipeline Run in Azure DevOps
        </a>
      )}

      <ol className="space-y-3 text-sm">
        {data.timeline.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
          >
            <div>
              <p className="font-semibold">{step.name}</p>
              <p className="text-xs text-gray-500">{step.status}</p>
              {step.result && (
                <p className="text-xs text-gray-400">Result: {step.result}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
