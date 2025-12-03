"use client";

import { useState } from "react";
import { deployArchitecture } from "./actions/deploy";

export default function Wizard() {
  const [result, setResult] = useState<unknown | null>(null);

  async function handleDeploy() {
    const payload = {
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",
      requirements: {
        environment: "dev",
        region: "westeurope",
      },
    };

    const res = await deployArchitecture(payload);
    setResult(res);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleDeploy}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        Deploy Architecture
      </button>
      {result ? (
        <pre className="rounded bg-gray-900 p-3 text-sm text-white">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
