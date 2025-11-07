"use client";
import { useEffect, useState } from "react";
import { fetchManualFlow, type ManualFlowResponse } from "../../lib/api";

export default function Manual() {
  const [data, setData] = useState<ManualFlowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManualFlow()
      .then(setData)
      .catch(() => setError("Failed to load manual onboarding template."));
  }, []);

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8">Loading manual flow template...</div>;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Manual Onboarding</h1>
      <pre className="bg-gray-100 p-4 rounded-lg text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
