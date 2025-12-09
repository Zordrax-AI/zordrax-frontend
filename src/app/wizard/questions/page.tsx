// src/app/wizard/questions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingQuestion } from "@/types/onboarding";

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/ai/questions`
        );
        const data = (await res.json()) as OnboardingQuestion[];
        setQuestions(data);
      } catch (err) {
        console.error("Failed to load onboarding questions", err);
      }
    }

    loadQuestions();
  }, []);

  function handleChange(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleNext() {
    // store answers for later steps
    localStorage.setItem("onboarding_answers", JSON.stringify(answers));
    router.push("/wizard/review");
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">AI Onboarding</h1>

      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium">{q.text}</p>

          {q.type === "text" ? (
            <input
              className="border rounded px-3 py-2 w-full"
              value={answers[q.id] ?? ""}
              onChange={(e) => handleChange(q.id, e.target.value)}
            />
          ) : (
            <select
              className="border rounded px-3 py-2 w-full"
              value={answers[q.id] ?? ""}
              onChange={(e) => handleChange(q.id, e.target.value)}
            >
              <option value="">Select…</option>
              {q.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      <button
        onClick={handleNext}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={loading}
      >
        Continue
      </button>
    </div>
  );
}
