"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL;

export default function RecommendPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!BASE) {
      setError("Agent base URL is not configured.");
      return;
    }

    const raw = sessionStorage.getItem("onboarding_answers");

    if (!raw) {
      router.push("/portal/onboarding/questions");
      return;
    }

    let answers;
    try {
      answers = JSON.parse(raw);
    } catch {
      setError("Invalid onboarding answers.");
      return;
    }

    fetch(`${BASE}/ai/recommend-stack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((res) => {
        setData(res);
        sessionStorage.setItem(
          "onboarding_manifest",
          JSON.stringify(res)
        );
      })
      .catch((err) => {
        console.error("Recommendation fetch failed:", err);
        setError("Failed to generate recommendation.");
      });
  }, [router]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push("/portal/onboarding/questions")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          Back to questions
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-slate-400">
        Generating recommendation…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Recommended Stack</h2>

      <pre className="rounded-md bg-slate-900 p-4 text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/portal/onboarding/questions")}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Back
        </button>

        <button
          onClick={() => router.push("/portal/onboarding/deploy")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          Deploy this stack
        </button>
      </div>
    </div>
  );
}
