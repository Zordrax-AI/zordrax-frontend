"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ArchitectureRecommendation,
  Manifest
} from "@/types/onboarding";

export default function ManifestPage() {
  const router = useRouter();

  const [architecture, setArchitecture] = useState<ArchitectureRecommendation | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);

  // ------------------------------------------------------------
  // Load the AI-generated architecture from storage
  // ------------------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem("architecture");
    if (stored) {
      const arch: ArchitectureRecommendation = JSON.parse(stored);
      setArchitecture(arch);

      // Convert architecture → manifest
      const generatedManifest: Manifest = {
        infrastructure: arch.infrastructure,
        etl: arch.etl,
        governance: arch.governance,
        bi: arch.bi,
      };

      setManifest(generatedManifest);

      // Persist for deploy step
      localStorage.setItem("terraform_manifest", JSON.stringify(generatedManifest));
    }
  }, []);

  if (!architecture) {
    return <div className="p-6">No architecture found — complete onboarding first.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Generated Terraform Manifest</h1>

      {/* Architecture Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Architecture Recommendation</h2>
        <pre className="bg-gray-900 text-white text-sm p-4 rounded overflow-auto">
          {JSON.stringify(architecture, null, 2)}
        </pre>
      </div>

      {/* Manifest Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Terraform Manifest</h2>
        <pre className="bg-gray-900 text-white text-sm p-4 rounded overflow-auto">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      </div>

      <button
        onClick={() => router.push("/wizard/deploy")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue to Deployment
      </button>
    </div>
  );
}
