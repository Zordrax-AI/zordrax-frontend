"use client";

import { useState } from "react";

export default function Wizard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleDeploy() {
    setLoading(true);

    const payload = {
      project_name: "zordrax-demo",
      description: "AI deploy from wizard",
      requirements: {
        environment: "dev",
        region: "westeurope",
      },
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/ai-and-deploy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("DEPLOY FAILED:", err);
      setResult({ error: err.message });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4 p-6">
      <button
        onClick={handleDeploy}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? "Deploying..." : "Deploy Architecture"}
      </button>

      {result && (
        <pre className="rounded bg-gray-900 p-3 text-sm text-white">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
