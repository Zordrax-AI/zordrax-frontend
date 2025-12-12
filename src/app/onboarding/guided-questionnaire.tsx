"use client";

import { useState, useEffect } from "react";

export default function GuidedWizard() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function load() {
      const res = await fetch(process.env.NEXT_PUBLIC_ONBOARDING_API_URL + "/ai/questions");
      const json = await res.json();
      setQuestions(json);
      setCurrent(json[0]);
    }
    load();
  }, []);

  async function next() {
    const res = await fetch(process.env.NEXT_PUBLIC_ONBOARDING_API_URL + "/ai/next-question", {
      method: "POST",
      body: JSON.stringify({
        previous_answers: answers,
        industry: answers.industry || null
      }),
      headers: { "Content-Type": "application/json" }
    });

    const nextQ = await res.json();
    setCurrent(nextQ);
  }

  function answerSelected(val: string) {
    setAnswers(prev => ({ ...prev, [current.id]: val }));
    next();
  }

  if (!current) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg">{current.text}</h2>
      <div className="flex flex-col gap-2">
        {current.options.map(opt =>
          <button
            key={opt}
            onClick={() => answerSelected(opt)}
            className="px-3 py-2 bg-slate-800 rounded"
          >
            {opt}
          </button>
        )}
      </div>
    </div>
  );
}
