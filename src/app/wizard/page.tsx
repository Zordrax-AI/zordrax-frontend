"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DeploymentPayload } from "./actions/deploy";
import { deployArchitecture } from "./actions/deploy";

export default function Wizard() {
  const [result, setResult] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDeploy() {
    setLoading(true);

    const payload: DeploymentPayload = {
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",
      requirements: {
        environment: "dev",
        region: "westeurope",
      },
    };

    try {
      const data = await deployArchitecture(payload);
      setResult(data);

      const runId = (data as any)?.pipeline_run?.id;
      if (runId) {
        router.push(`/wizard/status?run=${runId}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error during deployment";
      console.error("DEPLOY FAILED:", message);
      setResult({ error: message });
    } finally {
      setLoading(false);
    }
  }

  const renderResult = (value: unknown) => (
    <pre className="rounded bg-gray-900 p-3 text-sm text-white">
      {JSON.stringify(value, null, 2)}
    </pre>
  );

  return (
    <div className="space-y-4 p-6">
      <button
        onClick={handleDeploy}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy Architecture"}
      </button>

      {result !== null && renderResult(result)}
    </div>
  );
}
