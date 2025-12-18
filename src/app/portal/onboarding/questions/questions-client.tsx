"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

type Question = {
  key: string;
  question: string;
  options: string[];
  done?: boolean;
};

export default function QuestionsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");

  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API}/api/onboarding/sessions/${sessionId}/next-question`)
      .then((r) => r.json())
      .then(setQuestion);
  }, [sessionId]);

  async function answer(value: string) {
    if (!question || !sessionId) return;

    await fetch(
      `${API}/api/onboarding/sessions/${sessionId}/answer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: question.key, value }),
      }
    );

    const next = await fetch(
      `${API}/api/onboarding/sessions/${sessionId}/next-question`
    ).then((r) => r.json());

    if (next.done) {
      router.push(`/portal/onboarding/recommendation?session=${sessionId}`);
    } else {
      setQuestion(next);
    }
  }

  if (!question) return null;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{question.question}</h2>

      {question.options.map((o) => (
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
