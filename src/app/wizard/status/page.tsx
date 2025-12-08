"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PipelineStatus {
  run_id?: number;
  status?: string;
  stage?: string;
  message?: string;
  url?: string;
}

const STAGES = [
  "queued",
  "initializing",
  "provisioning",
  "terraform_plan",
  "terraform_apply",
  "finalizing",
  "completed",
  "failed",
];

function StatusContent() {
  const params = useSearchParams();
  const runId = params.get("run");

  const [details, setDetails] = useState<PipelineStatus | null>(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!runId) return;

    async function fetchStatus() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/pipeline/status/${runId}`
        );

        const data: PipelineStatus = await response.json();
        setDetails(data);
        setStatus(data.status ?? "unknown");
      } catch {
        setStatus("error");
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) {
    return (
      <div className="p-6 text-red-600 text-xl">
        Missing run ID — deployment cannot be tracked.
      </div>
    );
  }

  const currentStageIndex = STAGES.indexOf(details?.stage || "");

  const statusColor =
    status === "succeeded"
      ? "text-green-400"
      : status === "failed"
      ? "text-red-400"
      : status === "running"
      ? "text-yellow-300"
      : "text-gray-300";

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      {/* HEADER */}
      <h1 className="text-4xl font-bold mb-2 text-white">Deployment Status</h1>

      <p className="text-gray-400">
        Tracking pipeline run{" "}
        <span className="font-medium text-white">{runId}</span>
      </p>

      {/* STATUS CARD */}
      <div className="rounded-xl p-6 bg-gray-900 text-white shadow-lg">
        <div className={`text-3xl font-bold capitalize ${statusColor}`}>
          {status}
        </div>

        {details?.message && (
          <p className="mt-3 text-yellow-400 text-sm">{details.message}</p>
        )}

        {details?.url && (
          <a
            href={details.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-blue-600 py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            View Logs →
          </a>
        )}
      </div>

      {/* PROGRESS BAR */}
      <div>
        <div className="text-sm text-gray-400 mb-1">Progress</div>
        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-700"
            style={{
              width: `${Math.max(
                5,
                (currentStageIndex / (STAGES.length - 1)) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* STAGE TIMELINE */}
      <div className="space-y-4">
        <div className="text-lg font-semibold text-white">
          Deployment Stages
        </div>

        {STAGES.map((stage, i) => {
          const isCompleted = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;

          return (
            <div key={stage} className="flex items-center space-x-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  isCompleted
                    ? "bg-green-500"
                    : isCurrent
                    ? "bg-yellow-300 animate-pulse"
                    : "bg-gray-600"
                }`}
              />

              <div
                className={`text-lg capitalize ${
                  isCompleted
                    ? "text-green-400"
                    : isCurrent
                    ? "text-yellow-300"
                    : "text-gray-400"
                }`}
              >
                {stage.replace("_", " ")}
              </div>
            </div>
          );
        })}
      </div>

      {/* RAW JSON */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-white mb-2">
          Raw API Response
        </h2>
        <pre className="bg-black text-green-400 rounded-lg p-4 text-sm overflow-auto">
          {JSON.stringify({ status, details }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function DeploymentStatusPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading status…</div>}>
      <StatusContent />
    </Suspense>
  );
}
