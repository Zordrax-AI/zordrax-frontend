"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingQuestion } from "@/types/onboarding";

type Industry = "general" | "fleet" | "finance" | "retail";

interface NextQuestionResponse extends Partial<OnboardingQuestion> {
  done?: boolean;
  answers?: Record<string, string>;
}

export default function QuestionsPage() {
  const router = useRouter();

  const [industry, setIndustry] = useState<Industry>("general");
  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load first question whenever industry changes
  useEffect(() => {
    setAnswers({});
    setCurrentAnswer("");
    fetchNextQuestion({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  async function fetchNextQuestion(prevAnswers: Record<string, string>) {
    setLoading(true);
    setError(null);
    setCurrentQuestion(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ONBOARDING_API_URL}/ai/next-question`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previous_answers: prevAnswers,
            industry: industry === "general" ? null : industry,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: NextQuestionResponse = await res.json();

if (data.done) {
  const enriched = {
    ...prevAnswers,
    industry, // e.g. "fleet" | "finance" | "retail" | "general"
  };

  localStorage.setItem("onboarding_answers", JSON.stringify(enriched));
  router.push("/wizard/review");
  return;
}


      if (!data.id || !data.text) {
        throw new Error("Invalid question payload from backend");
      }

      setCurrentQuestion({
        id: data.id,
        text: data.text,
        type: data.type ?? "select",
        options: data.options ?? [],
      });

      setCurrentAnswer(prevAnswers[data.id] ?? "");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error loading question";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    if (!currentQuestion) return;

    if (!currentAnswer) {
      setError("Please select or enter an answer before proceeding.");
      return;
    }

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: currentAnswer,
    };

    setAnswers(updatedAnswers);
    setCurrentAnswer("");
    await fetchNextQuestion(updatedAnswers);
  }

  function handleIndustryChange(value: Industry) {
    setIndustry(value);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Onboarding Questions</h1>
      <p className="text-gray-600">
        Answer a few questions so we can recommend the right data architecture
        and deployment path. Questions adapt based on your choices.
      </p>

      {/* Industry selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Industry / Use Case</label>
        <select
          value={industry}
          onChange={(e) => handleIndustryChange(e.target.value as Industry)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="general">General / Other</option>
          <option value="fleet">Fleet & Logistics</option>
          <option value="finance">Finance</option>
          <option value="retail">Retail / Ecommerce</option>
        </select>
      </div>

      {/* Question block */}
      <div className="mt-4">
        {loading && <div>Loading next question…</div>}

        {error && (
          <div className="mb-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && currentQuestion && (
          <div className="space-y-3">
            <div className="font-semibold">{currentQuestion.text}</div>

            {currentQuestion.type === "select" ? (
              <select
                className="border rounded px-3 py-2 w-full"
                value={currentAnswer}
                onChange={(e) => {
                  setError(null);
                  setCurrentAnswer(e.target.value);
                }}
              >
                <option value="">Select…</option>
                {currentQuestion.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="border rounded px-3 py-2 w-full"
                value={currentAnswer}
                onChange={(e) => {
                  setError(null);
                  setCurrentAnswer(e.target.value);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      <div>
        <button
          onClick={handleNext}
          disabled={loading || !currentQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Loading…" : "Next"}
        </button>
      </div>

      {/* Optional: show current answers for debugging */}
      {Object.keys(answers).length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-2">Current answers</h2>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(answers, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
