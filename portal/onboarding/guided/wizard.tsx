"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Question {
  id: string;
  text: string;
  type: "select" | "text";
  options?: string[];
}

interface RecommendationResponse {
  manifest: any;
  file_path: string;
}

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

// -------------------------
// Helper API callers
// -------------------------
async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${BASE}/ai/questions`);
  return res.json();
}

async function fetchNextQuestion(prev: any): Promise<Question | null> {
  const res = await fetch(`${BASE}/ai/next-question`, {
    method: "POST",
    body: JSON.stringify(prev),
    headers: { "Content-Type": "application/json" }
  });

  return res.json();
}

async function generateManifest(answers: any): Promise<RecommendationResponse> {
  const res = await fetch(`${BASE}/ai/manifest`, {
    method: "POST",
    body: JSON.stringify({
      project_name: "zordrax-project",
      infrastructure: answers.infrastructure,
      etl: answers.etl_tool,
      governance: answers.governance,
      bi: answers.bi_tool
    }),
    headers: { "Content-Type": "application/json" }
  });

  return res.json();
}

// -------------------------
// Main Wizard Component
// -------------------------
export default function GuidedWizard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [summaryMode, setSummaryMode] = useState(false);
  const [manifest, setManifest] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Load first questions
  useEffect(() => {
    async function init() {
      const q = await fetchQuestions();
      setQuestions(q);
      setCurrent(q[0]);
      setIndex(0);
    }
    init();
  }, []);

  // -------------------------
  // Handler for answering a question
  // -------------------------
  const selectAnswer = async (value: string) => {
    const updated = { ...answers, [current!.id]: value };
    setAnswers(updated);

    // If last predefined question → fetch dynamic next Q
    if (index === questions.length - 1) {
      const next = await fetchNextQuestion({
        previous_answers: updated,
        industry: updated.industry
      });

      if (!next || !next.id) {
        // No more questions → show summary
        setSummaryMode(true);
        return;
      }

      setCurrent(next);
      setIndex(prev => prev + 1);
      setQuestions(prev => [...prev, next]); // append dynamic q
    } else {
      // Move to next predefined question
      const next = questions[index + 1];
      setCurrent(next);
      setIndex(prev => prev + 1);
    }
  };

  // -------------------------
  // Back button logic
  // -------------------------
  const goBack = () => {
    if (index === 0) return;

    const prev = questions[index - 1];
    setCurrent(prev);
    setIndex(prevIndex => prevIndex - 1);

    // Also remove last answer
    const newAnswers = { ...answers };
    delete newAnswers[current!.id];
    setAnswers(newAnswers);

    setSummaryMode(false);
    setManifest(null);
  };

  // -------------------------
  // Generate manifest (final step)
  // -------------------------
  const generate = async () => {
    setLoading(true);
    const m = await generateManifest(answers);
    setManifest(m);
    setLoading(false);
  };

  // -------------------------
  // Render summary page
  // -------------------------
  if (summaryMode) {
    return (
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Review Your Answers</h2>

        <div className="space-y-2">
          {Object.entries(answers).map(([key, val]) => (
            <p key={key} className="text-sm">
              <span className="font-semibold">{key}</span>: {val as string}
            </p>
          ))}
        </div>

        {!manifest && (
          <Button variant="primary" onClick={generate}>
            {loading ? "Generating..." : "Generate Manifest"}
          </Button>
        )}

        {manifest && (
          <div className="mt-4 space-y-3">
            <p className="text-green-400 text-sm">
              Manifest generated successfully.
            </p>
            <pre className="bg-slate-900 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(manifest.manifest, null, 2)}
            </pre>

            <a
              href={manifest.file_path}
              target="_blank"
              className="text-sky-300 underline text-sm"
            >
              Download Manifest File
            </a>
          </div>
        )}

        <Button variant="outline" onClick={goBack}>
          Back
        </Button>
      </Card>
    );
  }

  // -------------------------
  // Render question UI
  // -------------------------
  if (!current) return <p>Loading wizard...</p>;

  return (
    <Card className="p-6 space-y-4">
      {/* Progress bar */}
      <div className="text-xs text-slate-400">
        Step {index + 1} of {questions.length}
      </div>

      <h2 className="text-lg font-semibold">{current.text}</h2>

      <div className="flex flex-col gap-3">
        {current.type === "select" &&
          current.options?.map(opt => (
            <Button
              key={opt}
              variant="outline"
              onClick={() => selectAnswer(opt)}
            >
              {opt}
            </Button>
          ))}
      </div>

      {/* Back Button */}
      {index > 0 && (
        <Button variant="ghost" onClick={goBack}>
          Back
        </Button>
      )}
    </Card>
  );
}
