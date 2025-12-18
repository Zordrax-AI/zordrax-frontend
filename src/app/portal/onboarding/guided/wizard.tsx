"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

type Question = {
  key: string;
  question: string;
  options: string[];
  done?: boolean;
};

/* ---------------- API ---------------- */

async function createSession(): Promise<{ session_id: string }> {
  const res = await fetch(`${API}/api/onboarding/sessions`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

async function getNextQuestion(sessionId: string): Promise<Question> {
  const res = await fetch(
    `${API}/api/onboarding/sessions/${sessionId}/next-question`
  );
  if (!res.ok) throw new Error("Failed to fetch next question");
  return res.json();
}

async function answerQuestion(
  sessionId: string,
  key: string,
  value: string
) {
  const res = await fetch(
    `${API}/api/onboarding/sessions/${sessionId}/answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }
  );

  if (!res.ok) throw new Error("Failed to submit answer");
}

/* ---------------- COMPONENT ---------------- */

export default function GuidedWizard() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(
    async (sid: string) => {
      const q = await getNextQuestion(sid);

      if (q.done) {
        router.push(
          `/portal/onboarding/recommendation?session=${sid}`
        );
        return;
      }

      setQuestion(q);
    },
    [router]
  );

  useEffect(() => {
    (async () => {
      try {
        const { session_id } = await createSession();
        setSessionId(session_id);
        await loadNext(session_id);
      } catch (e: any) {
        setError(e?.message || "Failed to start onboarding");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadNext]);

  async function pick(value: string) {
    if (!sessionId || !question) return;

    try {
      setBusy(true);
      await answerQuestion(sessionId, question.key, value);
      await loadNext(sessionId);
    } catch (e: any) {
      setError(e?.message || "Failed to submit answer");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- UI STATES ---------------- */

  if (loading) {
    return <div className="p-6">Starting onboarding…</div>;
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
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{question.question}</h2>

      <div className="space-y-2">
        {question.options.map((opt) => (
          <Button
            key={opt}
            variant="outline"
            onClick={() => pick(opt)}
          >
            {busy ? "…" : opt}
          </Button>
        ))}
      </div>
    </Card>
  );
}
