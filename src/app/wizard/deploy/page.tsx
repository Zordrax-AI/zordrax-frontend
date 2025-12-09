"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectureRecommendation, DeployResponse } from "@/types/onboarding";
import { deployArchitecture, DeployError } from "../actions/deploy";

type DeployResult = DeployResponse | DeployError;

export default function DeployPage() {
  const router = useRouter();

  const [architecture, setArchitecture] = useState<ArchitectureRecommendation | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("architecture");
    if (stored) {
      setArchitecture(JSON.parse(stored) as ArchitectureRecommendation);
    }
  }, []);

  async function handleDeploy() {
    if (!architecture) {
      alert("Architecture missing — complete onboarding first.");
      return;
    }

    setLoading(true);

    // ensure required fields exist
    const payload: ArchitectureRecommendation = {
      ...architecture,
      project_name: architecture.project_name ?? "zordrax-demo",
      description: architecture.description ?? "AI deployment via wizard",
    };

    const resp = await deployArchitecture(payload);

    setResult(resp);

    if ("error" in resp) {
      setLoading(false);
      return; // stop redirect
    }

    const runId = resp.pipeline_run?.id;
    if (runId) router.push(`/wizard/status?run=${runId}`);

    setLoading(false);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Deploy Infrastructure</h1>

      {architecture && (
        <pre className="rounded bg-gray-900 p-3 text-sm text-white overflow-auto">
          {JSON.stringify(architecture, null, 2)}
        </pre>
      )}

      <button
        disabled={loading}
        onClick={handleDeploy}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy"}
      </button>

      {result && (
        <pre className="rounded bg-gray-900 p-3 text-sm text-white overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
