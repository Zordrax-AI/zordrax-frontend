"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

type LocalQuestion = {
  id: string;
  label: string;
  options: string[];
};

const QUESTIONS: LocalQuestion[] = [
  {
    id: "company_size",
    label: "What is your company size?",
    options: ["1–10", "11–50", "51–200", "200+"],
  },
  {
    id: "cloud_provider",
    label: "Primary cloud provider?",
    options: ["Azure", "AWS", "GCP", "Hybrid"],
  },
];

export default function GuidedQuestionnaire() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = QUESTIONS[index];

  function answer(opt: string) {
    setAnswers((a) => ({ ...a, [q.id]: opt }));
    setIndex((i) => Math.min(i + 1, QUESTIONS.length - 1));
  }

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Guided Questionnaire</h2>

        <div className="text-sm text-slate-200">{q.label}</div>

        <div className="space-y-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => answer(opt)}
              className="block w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm hover:bg-slate-900"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
