"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type {
  EtlSpec,
  GovernanceSpec,
  BiSpec,
  ArchitectureRecommendation,
  DeployResponse
} from "@/types/onboarding";

import type { DeployError } from "../actions/deploy";
import { deployArchitecture } from "../actions/deploy";

// Manifest type that matches EXACT backend structure
type Manifest = {
  infrastructure: Record<string, unknown>;
  etl: EtlSpec;
  governance: GovernanceSpec;
  bi: BiSpec;
};

// Union type for success OR error responses
type DeployResult = DeployResponse | DeployError;

export default function DeployPage() {
  const router = useRouter();

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load manifest from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("terraform_manifest");
    if (stored) {
      setManifest(JSON.parse(stored) as Manifest);
    }
  }, []);

  async function handleDeploy() {
    if (!manifest) {
      alert("Manifest missing — complete onboarding first.");
      return;
    }

    setLoading(true);

    // Build the payload EXACTLY matching backend ArchitectureRecommendation
    const payload: ArchitectureRecommendation = {
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",
      requirements: {
        environment: "dev",
        region: "westeurope"
      },
      infrastructure: manifest.infrastructure,
      etl: manifest.etl,
      governance: manifest.governance,
      bi: manifest.bi
    };

    const resp = await deployArchitecture(payload);
    setResult(resp);

    // Stop if backend reports an error
    if ("error" in resp) {
      setLoading(false);
      return;
    }

    // Redirect to deployment status dashboard
    const runId = resp.pipeline_run?.id;
    if (runId) {
      router.push(`/wizard/status?run=${runId}`);
    }

    setLoading(false);
  }

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold">Deploy Infrastructure</h1>

      {manifest && (
        <pre className="bg-gray-900 text-white p-3 rounded text-sm overflow-auto">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      )}

      <button
        onClick={handleDeploy}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Deploying…" : "Deploy Infrastructure"}
      </button>

      {result && (
        <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
