"use client";

import { useEffect, useState } from "react";
import type { Architecture } from "@/types/onboarding";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<Architecture | null>(null);

  useEffect(() => {
    async function loadRecommendation() {
      const stored = localStorage.getItem("onboarding_answers");
      const answers: Record<string, string> = stored ? JSON.parse(stored) : {};

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/recommend-stack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data: Architecture = await res.json();
      setRecommendation(data);

      localStorage.setItem("architecture", JSON.stringify(data));
    }

    loadRecommendation();
  }, []);

  if (!recommendation) {
    return <div className="p-6">Loading recommendation...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recommended Architecture</h1>

      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(recommendation, null, 2)}
      </pre>

      <button
        onClick={() => router.push("/wizard/manifest")}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Continue to Manifest
      </button>
    </div>
  );
}
