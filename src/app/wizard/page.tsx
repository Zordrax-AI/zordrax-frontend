"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deployArchitecture, DeploymentPayload } from "./actions/deploy";

interface DeployResponse {
  pipeline_run?: {
    id?: number;
    url?: string;
  };
  status?: string;
  project_name?: string;
}

export default function Wizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("terraform_manifest");
    if (stored) setManifest(JSON.parse(stored));
  }, []);

  async function handleDeploy() {
    if (!manifest) {
      alert("Manifest missing — complete onboarding first.");
      return;
    }

    setLoading(true);

    const payload: DeploymentPayload = {
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",
      requirements: {
        environment: "dev",
        region: "westeurope",
      },
      infrastructure: manifest.infrastructure,
      etl: manifest.etl,
      governance: manifest.governance,
      bi: manifest.bi,
    };

    try {
      const data = (await deployArchitecture(payload)) as DeployResponse;
      setResult(data);

      const runId = data.pipeline_run?.id;
      if (runId) router.push(`/wizard/status?run=${runId}`);
    } catch (err) {
      console.error("DEPLOY FAILED:", err);
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold">Ready to Deploy</h1>

      <pre className="rounded bg-gray-800 p-3 text-sm text-white overflow-auto">
        {JSON.stringify(manifest, null, 2)}
      </pre>

      <button
        onClick={handleDeploy}
        disabled={loading}
        className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy Infrastructure"}
      </button>

      {result && (
        <pre className="rounded bg-gray-900 p-3 text-sm text-white">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
