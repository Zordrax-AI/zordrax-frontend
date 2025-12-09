"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ArchitectureRecommendation,
  EtlSpec,
  GovernanceSpec,
  BiSpec
} from "@/types/onboarding";

// Manifest slice that matches backend shape EXACTLY
type Manifest = {
  infrastructure: Record<string, unknown>;
  etl: EtlSpec;
  governance: GovernanceSpec;
  bi: BiSpec;
};

export default function ManifestPage() {
  const router = useRouter();

  const [architecture, setArchitecture] =
    useState<ArchitectureRecommendation | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("architecture");
    if (!stored) return;

    const arch: ArchitectureRecommendation = JSON.parse(stored);
    setArchitecture(arch);

    // SAFELY normalise all required fields
    const generatedManifest: Manifest = {
      infrastructure: arch.infrastructure ?? {},

      etl: {
        tool: arch.etl?.tool ?? "unknown",
      },

      governance: {
        rules: arch.governance?.rules ?? [],
      },

      bi: {
        tool: arch.bi?.tool ?? "none",
        model: arch.bi?.model ?? undefined,
        kpis: arch.bi?.kpis ?? [],
      }
    };

    setManifest(generatedManifest);

    localStorage.setItem(
      "terraform_manifest",
      JSON.stringify(generatedManifest)
    );
  }, []);

  if (!architecture) {
    return (
      <div className="p-6">
        No architecture found — complete onboarding first.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Generated Terraform Manifest</h1>

      <div>
        <h2 className="text-lg font-semibold mb-2">
          Architecture Recommendation
        </h2>
        <pre className="bg-gray-900 text-white text-sm p-4 rounded overflow-auto">
          {JSON.stringify(architecture, null, 2)}
        </pre>
      </div>

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
