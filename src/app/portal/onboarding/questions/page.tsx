"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  label: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    id: "company_size",
    label: "What is your company size?",
    options: ["1-10", "11-50", "51-200", "200+"],
  },
  {
    id: "cloud_provider",
    label: "Primary cloud provider?",
    options: ["Azure", "AWS", "GCP", "Hybrid"],
  },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = QUESTIONS[index];

  function answer(opt: string) {
    const next = { ...answers, [q.id]: opt };
    setAnswers(next);

    if (index === QUESTIONS.length - 1) {
      sessionStorage.setItem("onboarding_answers", JSON.stringify(next));
      router.push("/portal/onboarding/recommend");
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-semibold">{q.label}</h2>

      <div className="space-y-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => answer(opt)}
            className="block w-full rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-left hover:bg-slate-800"
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push("/portal/onboarding")}
        className="mt-6 text-sm text-slate-400 hover:text-white"
      >
        &larr; Back to overview
      </button>
    </div>
  );
}
