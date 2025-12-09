"use client";

import { useEffect, useState } from "react";
import type { Architecture, Manifest } from "@/types/onboarding";
import { useRouter } from "next/navigation";

export default function ManifestPage() {
  const router = useRouter();
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    async function loadManifest() {
      const stored = localStorage.getItem("architecture");
      if (!stored) return;

      const architecture: Architecture = JSON.parse(stored);

      const res = await fetch(`${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/ai/manifest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(architecture),
      });

      const data: { manifest: Manifest } = await res.json();
      setManifest(data.manifest);

      localStorage.setItem("terraform_manifest", JSON.stringify(data.manifest));
    }

    loadManifest();
  }, []);

  if (!manifest) {
    return <div className="p-6">Generating manifest...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Terraform Manifest Preview</h1>

      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(manifest, null, 2)}
      </pre>

      <button
        onClick={() => router.push("/wizard/deploy")}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Deploy Infrastructure
      </button>
    </div>
  );
}
