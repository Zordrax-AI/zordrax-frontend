"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

type Question = {
  key: string;
  question: string;
  options: string[];
  done?: boolean;
};

export default function QuestionsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");

  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      // HARD redirect — user entered illegally
      router.replace("/portal/onboarding");
      return;
    }

    fetch(`${API}/api/onboarding/sessions/${sessionId}/next-question`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load question");
        return r.json();
      })
      .then(setQuestion)
      .catch((e) => setError(e.message));
  }, [sessionId, router]);

  async function answer(value: string) {
    if (!question || !sessionId) return;

    await fetch(`${API}/api/onboarding/sessions/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: question.key, value }),
    });

    const next = await fetch(
      `${API}/api/onboarding/sessions/${sessionId}/next-question`
    ).then((r) => r.json());

    if (next.done) {
      router.push(`/portal/onboarding/recommendation?session=${sessionId}`);
    } else {
      setQuestion(next);
    }
  }

  if (!question && !error) {
    return <div className="p-6">Loading question…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{question!.question}</h2>
      {question!.options.map((o) => (
        <button
          key={o}
          onClick={() => answer(o)}
          className="block w-full rounded bg-slate-800 p-3 hover:bg-slate-700"
        >
          {o}
        </button>
      ))}
    </div>
  );
}
