// src/app/wizard/review/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectureRecommendation } from "@/types/onboarding";

export default function ReviewPage() {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [architecture, setArchitecture] =
    useState<ArchitectureRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedAnswers = localStorage.getItem("onboarding_answers");
    if (!storedAnswers) {
      router.push("/wizard/questions");
      return;
    }

    const parsed = JSON.parse(storedAnswers) as Record<string, string>;
    setAnswers(parsed);

    async function fetchArchitecture() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/ai/recommend-stack`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: parsed }),
          }
        );

        if (!res.ok) {
          throw new Error(`Backend returned ${res.status}`);
        }

        const data = (await res.json()) as ArchitectureRecommendation;
        setArchitecture(data);
        localStorage.setItem("architecture", JSON.stringify(data));
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch architecture"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchArchitecture();
  }, [router]);

  if (loading && !architecture) {
    return <div className="p-6">Calculating architecture…</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Review Answers & Architecture</h1>

      <div>
        <h2 className="text-lg font-semibold mb-2">Your Answers</h2>
        <pre className="bg-gray-900 text-white text-sm p-4 rounded overflow-auto">
          {JSON.stringify(answers, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">AI Architecture</h2>
        {error && (
          <p className="text-red-500 text-sm mb-2">Error: {error}</p>
        )}
        <pre className="bg-gray-900 text-white text-sm p-4 rounded overflow-auto">
          {JSON.stringify(architecture, null, 2)}
        </pre>
      </div>

      <button
        onClick={() => router.push("/wizard/manifest")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue to Manifest
      </button>
    </div>
  );
}
