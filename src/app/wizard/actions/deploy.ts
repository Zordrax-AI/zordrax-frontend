"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectureRecommendation, DeployResponse } from "@/types/onboarding";
import { deployArchitecture } from "../actions/deploy";

export default function DeployPage() {
  const router = useRouter();

  const [architecture, setArchitecture] = useState<ArchitectureRecommendation | null>(null);
  const [result, setResult] = useState<DeployResponse | null>(null);
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

    const payload: ArchitectureRecommendation = {
      ...architecture,
      project_name: architecture.project_name ?? "zordrax-demo",
      description: architecture.description ?? "AI deployment via wizard",
    };

    try {
      setLoading(true);

      const resp = await deployArchitecture(payload);

      setResult(resp);

      const runId = resp.pipeline_run?.id;
      if (runId) {
        router.push(`/wizard/status?run=${runId}`);
      }
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
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
