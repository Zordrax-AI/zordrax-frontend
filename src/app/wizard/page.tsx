"use client";

import { useEffect, useState } from "react";

type Recommendations = Record<string, unknown> | unknown[];

interface PipelineRun {
  run_id?: number;
  web_url?: string;
}

interface DeploymentResponse {
  status?: string;
  message?: string;
  recommendations?: Recommendations;
  pipeline_run?: PipelineRun;
}

interface BuildStatusResponse {
  status?: string;
  result?: string;
}

/**
 * WizardPage — Triggers the AI onboarding + deployment process
 *  - Calls FastAPI: /onboarding/ai-and-deploy
 *  - Polls FastAPI: /devops/status/{run_id} every 20s
 *  - Displays AI recommendations and build status
 */
export default function WizardPage() {
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [buildState, setBuildState] = useState<string>("");

  // --- Poll DevOps build status every 20s when run_id is active ---
  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/devops/status/${runId}`
        );
        if (!res.ok) throw new Error(`Failed to fetch build status (${res.status})`);

        const data: BuildStatusResponse = await res.json();
        if (data.status === "completed") {
          const resultText =
            data.result === "succeeded" ? "✅ Build succeeded" : "❌ Build failed";
          setBuildState(resultText);
          clearInterval(interval);
        } else if (data.status === "inProgress") {
          setBuildState("⏳ Build running...");
        } else {
          setBuildState(`ℹ️ Status: ${data.status || "unknown"}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
        setBuildState("⚠️ Could not fetch build status");
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [runId]);

  // --- Trigger AI + Infra Deployment ---
  const handleDeploy = async () => {
    setLoading(true);
    setStatusMsg("🚀 Deploying...");
    setBuildState("");
    setRecommendations(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/onboarding/ai-and-deploy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: "zordrax_project",
            environment: "dev",
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API returned ${res.status}: ${text}`);
      }

      const data: DeploymentResponse = await res.json();

      if (!data?.status) {
        throw new Error("Empty or invalid API response");
      }

      // ✅ Update AI recommendations display
      setRecommendations(data.recommendations ?? null);

      // ✅ If pipeline run triggered, begin polling
      if (typeof data.pipeline_run?.run_id === "number") {
        setRunId(data.pipeline_run.run_id);
      }

      // ✅ Success message with clickable DevOps link
      let successMsg = data.message || "Deployment triggered successfully.";
      if (data.pipeline_run?.web_url) {
        successMsg += ` — <a href="${data.pipeline_run.web_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">View Build #${data.pipeline_run.run_id}</a>`;
      } else if (data.pipeline_run?.run_id) {
        successMsg += ` (Build #${data.pipeline_run.run_id})`;
      }

      setStatusMsg(`✅ ${successMsg}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Deploy failed:", err);
      setStatusMsg(`❌ Deployment failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  return (
    <main className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="max-w-2xl bg-white shadow-xl rounded-2xl p-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Zordrax Analytica — AI Onboarding Wizard
        </h1>

        <p className="text-gray-600 mb-6">
          Launch adaptive infrastructure & pipelines powered by the Zordrax AI Orchestration
          Agent.
        </p>

        <button
          onClick={handleDeploy}
          disabled={loading}
          className={`px-6 py-3 rounded-xl text-white font-semibold transition ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Deploying..." : "Deploy AI Architecture"}
        </button>

        <div
          className="mt-6 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: statusMsg }}
        />

        {buildState && (
          <div className="mt-3 text-sm font-medium text-gray-800">
            🧱 Build status: {buildState}
          </div>
        )}

        {recommendations && (
          <div className="mt-8 border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800">
              🤖 AI Recommendations
            </h2>
            <pre className="text-xs text-gray-600 mt-2 bg-gray-100 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(recommendations, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
