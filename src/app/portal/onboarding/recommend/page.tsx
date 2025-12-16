"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function RecommendPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("onboarding_answers");

    if (!raw) {
      router.push("/portal/onboarding/questions");
      return;
    }

    const answers = JSON.parse(raw);

    fetch(`${BASE}/ai/recommend-stack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        sessionStorage.setItem(
          "onboarding_manifest",
          JSON.stringify(res)
        );
      });
  }, []);

  if (!data) {
    return <div className="text-slate-400">Generating recommendation…</div>;
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
