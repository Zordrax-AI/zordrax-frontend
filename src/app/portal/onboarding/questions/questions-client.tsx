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
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");

  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing onboarding session.");
      setLoading(false);
      return;
    }

    fetch(`${API}/api/onboarding/sessions/${sessionId}/next-question`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load question");
        return res.json();
      })
      .then((data) => {
        setQuestion(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId]);

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

  // ---------------- UI STATES ----------------

  if (loading) {
    return <div className="p-6">Loading question…</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-400">
        {error}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-6 text-slate-400">
        No questions available.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{question.question}</h2>

      {question.options.map((opt) => (
        <button
          key={opt}
          onClick={() => answer(opt)}
          className="block w-full rounded bg-slate-800 p-3 text-left hover:bg-slate-700"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
