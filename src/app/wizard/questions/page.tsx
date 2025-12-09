"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function loadQuestions() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/questions`);
      const data = await res.json();
      setQuestions(data);
    }
    loadQuestions();
  }, []);

  function handleChange(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }

  async function handleNext() {
    localStorage.setItem("onboarding_answers", JSON.stringify(answers));
    router.push("/wizard/review");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Onboarding Questions</h1>

      {questions.map(q => (
        <div key={q.id} className="mb-4">
          <label className="font-semibold">{q.text}</label>
          <select
            className="border p-2 rounded w-full mt-1"
            onChange={(e) => handleChange(q.id, e.target.value)}
          >
            <option value="">Select…</option>
            {q.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}

      <button
        onClick={handleNext}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Review Architecture
      </button>
    </div>
  );
}
