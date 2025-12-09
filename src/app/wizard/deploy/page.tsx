"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { DeployResponse } from "@/types/onboarding";
import type { DeployError } from "./actions/deploy";
import { deployArchitecture } from "./actions/deploy";

type EtlSpec = { tool: string };
type GovernanceSpec = { rules: string[] };
type BiSpec = { tool: string };

type Manifest = {
  infrastructure: Record<string, unknown>;
  etl: EtlSpec;
  governance: GovernanceSpec;
  bi: BiSpec;
};

type DeployResult = DeployResponse | DeployError;

export default function WizardPage() {
  const router = useRouter();

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("terraform_manifest");
    if (stored) {
      const raw = JSON.parse(stored);

      const normalized: Manifest = {
        infrastructure: raw.infrastructure ?? {},
        etl: { tool: raw.etl?.tool ?? "unknown" },
        governance: { rules: raw.governance?.rules ?? [] },
        bi: { tool: raw.bi?.tool ?? "none" },
      };

      setManifest(normalized);
    }
  }, []);

  async function handleDeploy() {
    if (!manifest) {
      alert("Manifest missing — complete onboarding first.");
      return;
    }

    setLoading(true);

    const resp = await deployArchitecture({
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",

      infrastructure: manifest.infrastructure,
      etl: manifest.etl,
      governance: manifest.governance,
      bi: manifest.bi,
    });

    setResult(resp);

    if ("error" in resp) {
      setLoading(false);
      return;
    }

    const runId = resp.pipeline_run?.id;
    if (runId) router.push(`/wizard/status?run=${runId}`);

    setLoading(false);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Ready to Deploy</h1>

      {manifest && (
        <pre className="bg-gray-900 text-white p-3 rounded text-sm overflow-auto">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      )}

      <button
        onClick={handleDeploy}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy Infrastructure"}
      </button>

      {result && (
        <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
