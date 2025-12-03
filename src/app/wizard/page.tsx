"use client";

import { deployArchitecture } from "./actions/deploy";
import { useState } from "react";

export default function Wizard() {
  const [result, setResult] = useState(null);

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
    <button
      onClick={handleDeploy}
      className="px-4 py-2 rounded bg-blue-600 text-white"
    >
      Deploy Architecture
    </button>
  );
}
