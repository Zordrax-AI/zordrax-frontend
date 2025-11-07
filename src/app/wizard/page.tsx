"use client";

import { useEffect, useState } from "react";
import {
  fetchAiFlow,
  triggerDeployment,
  type AiFlowResponse,
} from "../../lib/api";

export default function Wizard() {
  const [data, setData] = useState<AiFlowResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAiFlow()
      .then(setData)
      .catch(() => setStatus("Failed to load AI recommendations."));
  }, []);

  const handleDeploy = async () => {
    if (!data) return;

    const requirementsPayload =
      data.requirements ?? { stack: data.recommendation };
    const onboardingPayload =
      data.onboarding ??
      {
        owner: "AI Deployment Bot",
        steps: [
          "Validate stack recommendations",
          "Provision resources",
          "Run governance checklist",
        ],
      };

    setLoading(true);
    setStatus("Triggering pipeline...");
    try {
      const res = await triggerDeployment("ai", {
        requirements: requirementsPayload,
        onboarding: onboardingPayload,
      });
      setStatus(`Success: ${res.message}`);
    } catch (error) {
      console.error("Failed to trigger pipeline", error);
      setStatus("Failed to trigger pipeline.");
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="p-8">Loading AI recommendations...</div>;
  const r = data.recommendation;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">AI Recommended Stack</h1>
      <div className="grid gap-4">
        <div className="p-4 bg-white rounded-xl shadow">
          <b>Infrastructure:</b> {r.infrastructure}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <b>ETL:</b> {r.etl}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <b>Governance:</b> {r.governance}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <b>Reporting:</b> {r.reporting}
        </div>
      </div>

      <button
        onClick={handleDeploy}
        disabled={loading}
        className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy Architecture"}
      </button>

      {status && (
        <div className="mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded">
          {status}
        </div>
      )}
    </main>
  );
}
