"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { OnboardingQuestion } from "@/lib/types";
import { fetchNextQuestion } from "@/lib/api";

// -------------------------------
// Define shape for answers
// -------------------------------
interface GuidedAnswers {
  [key: string]: any;
  industry?: string;
}

export default function GuidedQuestionnaire() {
  const [answers, setAnswers] = useState<GuidedAnswers>({});
  const [currentQuestion, setCurrentQuestion] =
    useState<OnboardingQuestion | null>(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // Load next question
  // -------------------------------
  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNextQuestion(
        answers,
        answers.industry ?? null
      );
      setCurrentQuestion(data);
    } finally {
      setLoading(false);
    }
  }, [answers]);

  // -------------------------------
  // Load first question on mount
  // -------------------------------
  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  // -------------------------------
  // Handle answer selection
  // -------------------------------
  function handleAnswer(value: string) {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        {loading && (
          <p className="text-sm text-slate-400">Loading...</p>
        )}

        {!loading && currentQuestion && (
          <>
            <h2 className="text-lg font-semibold">
              {currentQuestion.text}
            </h2>

            <div className="flex flex-col gap-2">
              {currentQuestion.options?.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>

            <Button onClick={loadNextQuestion}>
              Next →
            </Button>
          </>
        )}
      </Card>

      <pre className="text-xs text-slate-400">
        {JSON.stringify(answers, null, 2)}
      </pre>
    </div>
  );
}
