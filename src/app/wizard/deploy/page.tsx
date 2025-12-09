"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Manifest } from "@/types/onboarding";
import { deployArchitecture } from "../actions/deploy";

export default function DeployPage() {
  const router = useRouter();

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

    const resp = await deployArchitecture({
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",
      requirements: { environment: "dev", region: "westeurope" },
      infrastructure: manifest.infrastructure,
      etl: manifest.etl,
      governance: manifest.governance,
      bi: manifest.bi,
    });

    setResult(resp);

    // If backend returned an error → stop here
    if ("error" in resp) {
      setLoading(false);
      return;
    }

    // On success, redirect to status page
    const runId = resp.pipeline_run?.id;
    if (runId) {
      router.push(`/wizard/status?run=${runId}`);
    }

    setLoading(false);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Deploy Infrastructure</h1>

      {manifest && (
        <pre className="rounded bg-gray-900 p-3 text-sm text-white overflow-auto">
          {JSON.stringify(manifest, null, 2)}
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
