"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { OnboardingQuestion } from "@/lib/types";

const STATIC_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "company_size",
    question: "What is your company size?",
    type: "select",
    options: ["1–10", "11–50", "51–200", "200+"],
  },
  {
    id: "cloud_provider",
    question: "Primary cloud provider?",
    type: "select",
    options: ["Azure", "AWS", "GCP", "Hybrid"],
  },
];

export default function GuidedQuestionnaire() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = STATIC_QUESTIONS[index];

  function handleAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setIndex((i) => Math.min(i + 1, STATIC_QUESTIONS.length - 1));
  }

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Guided Onboarding</h2>

        <div className="text-sm text-slate-200">{q.question}</div>

        <div className="space-y-2">
          {q.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="block w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm hover:bg-slate-900"
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Question {index + 1} of {STATIC_QUESTIONS.length}
        </div>
      </div>
    </Card>
  );
}
