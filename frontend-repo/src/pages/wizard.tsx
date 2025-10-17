"use client";
import { useEffect, useState } from "react";
import { fetchAIFLow } from "../lib/api";
import RecommendationCard from "../components/RecommendationCard";

export default function Wizard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAIFLow().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-8">Loading AI recommendations...</div>;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">AI Recommended Stack</h1>
      <RecommendationCard title="Infrastructure" details={{ value: data.recommendation.infrastructure }} />
      <RecommendationCard title="ETL" details={{ value: data.recommendation.etl }} />
      <RecommendationCard title="Governance" details={{ value: data.recommendation.governance }} />
      <RecommendationCard title="Reporting" details={{ value: data.recommendation.reporting }} />
    </main>
  );
}
