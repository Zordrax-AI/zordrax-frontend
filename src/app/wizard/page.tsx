"use client";

import { useEffect, useState } from "react";

type Recommendations = Record<string, unknown> | unknown[];

type DeploymentResponse = {
  status?: string;
  message?: string;
  recommendations?: Recommendations;
  pipeline_run?: {
    run_id?: number;
    web_url?: string;
  };
};

type BuildStatusResponse = {
  status?: string;
  result?: string;
};

export default function WizardPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [buildState, setBuildState] = useState<string>("");

  // Poll backend for DevOps build status every 20s if a run is active
  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devops/status/${runId}`);
        const data: BuildStatusResponse = await res.json();

        if (data.status === "completed") {
          setBuildState(data.result === "succeeded" ? "Build succeeded" : "Build failed");
          clearInterval(interval);
        } else if (data.status === "inProgress") {
          setBuildState("Build running...");
        } else {
          setBuildState(`Status: ${data.status || "unknown"}`);
        }
      } catch {
        setBuildState("Could not fetch build status");
      }
    }, 20000); // every 20 seconds

    return () => clearInterval(interval);
  }, [runId]);

  const handleDeploy = async () => {
    setLoading(true);
    setStatus("Deploying...");
    setBuildState("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/ai-and-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API returned ${res.status}: ${text}`);
      }

      const data: DeploymentResponse = await res.json();
      if (!data || !data.status) {
        throw new Error("Empty or invalid API response");
      }

      setRecommendations(data.recommendations ?? null);

      if (typeof data.pipeline_run?.run_id === "number") {
        setRunId(data.pipeline_run.run_id);
      }

      let successMessage = data.message || "Deployment triggered successfully.";
      if (data.pipeline_run?.web_url && typeof data.pipeline_run.run_id === "number") {
        successMessage += ` - <a href="${data.pipeline_run.web_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">View in DevOps (Build #${data.pipeline_run.run_id})</a>`;
      } else if (typeof data.pipeline_run?.run_id === "number") {
        successMessage += ` (Build #${data.pipeline_run.run_id})`;
      }

      setStatus(`✅ ${successMessage}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Deploy failed:", err);
      setStatus(`❌ Unexpected response from API: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="max-w-2xl bg-white shadow-xl rounded-2xl p-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Zordrax Analytica AI Onboarding
        </h1>

        <p className="text-gray-600 mb-6">
          Deploy adaptive data infrastructure and reporting pipelines through AI-driven orchestration.
        </p>

        <button
          onClick={handleDeploy}
          disabled={loading}
          className={`px-6 py-3 rounded-xl text-white font-semibold transition ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Deploying..." : "Deploy Architecture"}
        </button>

        <div
          className="mt-6 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: status }}
        />

        {buildState && (
          <div className="mt-3 text-sm font-medium text-gray-800">
            Build status: {buildState}
          </div>
        )}

        {recommendations && (
          <div className="mt-8 border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800">
              AI Recommendations
            </h2>
            <pre className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded-lg overflow-x-auto">
              {JSON.stringify(recommendations, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
