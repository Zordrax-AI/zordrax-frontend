"use client";
import { useEffect, useState } from "react";
import { fetchAiFlow } from "../../lib/api";

export default function Wizard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAiFlow()
      .then(setData)
      .catch(() => setError("Failed to load AI recommendations."));
  }, []);

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8">Loading AI recommendations...</div>;

  const r = data.recommendation;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">AI Recommended Stack</h1>
      <div className="grid gap-4">
        <div className="p-4 bg-white rounded-xl shadow">
          <b>Infrastructure:</b> {r.infrastructure}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <b>ETL:</b> {r.etl}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <b>Governance:</b> {r.governance}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <b>Reporting:</b> {r.reporting}
        </div>
      </div>
    </main>
  );
}
