"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function RecommendPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("onboarding_answers");

    // 1️⃣ No answers stored → redirect
    if (!raw) {
      router.push("/portal/onboarding/questions");
      return;
    }

    let answers: any;

    // 2️⃣ Invalid JSON → redirect
    try {
      answers = JSON.parse(raw);
    } catch {
      router.push("/portal/onboarding/questions");
      return;
    }

    // 3️⃣ Empty or invalid object → redirect
    if (
      !answers ||
      typeof answers !== "object" ||
      Object.keys(answers).length === 0
    ) {
      router.push("/portal/onboarding/questions");
      return;
    }

    // 4️⃣ Call backend
    fetch(`${BASE}/ai/recommend-stack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then((result) => {
        setData(result);
        sessionStorage.setItem(
          "onboarding_manifest",
          JSON.stringify(result)
        );
      })
      .catch((err) => {
        console.error("Recommendation fetch failed:", err);
        setError("Failed to generate recommendation.");
      });
  }, [router]);

  // 🔄 Loading state
  if (!data && !error) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Generating recommendation…</p>
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/portal/onboarding/questions")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          Back to questions
        </button>
      </div>
    );
  }

  // ✅ Success state
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
