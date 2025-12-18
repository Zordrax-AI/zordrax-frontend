"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  createSession,
  getNextQuestion,
  answerQuestion,
} from "@/lib/agent";

type Question = {
  key: string;
  question: string;
  options: string[];
  done?: boolean;
};

export default function GuidedWizard() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNext(sid: string) {
    const q = await getNextQuestion(sid);

    if (q?.done) {
      router.push(`/portal/onboarding/recommendation?session=${sid}`);
      return;
    }

    setQuestion(q);
  }

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
  }, []);

  async function pick(value: string) {
    if (!sessionId || !question || busy) return;

    setBusy(true);
    setError(null);

    try {
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
    return (
      <Card className="p-6">
        <div className="text-sm text-slate-300">Loading onboarding…</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 space-y-3">
        <div className="text-sm text-red-200">{error}</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card className="p-6">
        <div className="text-sm text-slate-400">
          No questions available.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="text-xs text-slate-400">
        Session: <span className="font-mono">{sessionId}</span>
      </div>

      <h2 className="text-lg font-semibold">{question.question}</h2>

      <div className="flex flex-col gap-3">
        {question.options.map((opt) => (
          <Button
            key={opt}
            variant="outline"
            onClick={() => pick(opt)}
            className={
              busy
                ? "opacity-50 pointer-events-none"
                : ""
            }
          >
            {busy ? "Submitting…" : opt}
          </Button>
        ))}
      </div>

      <div className="text-xs text-slate-500">
        Answers are persisted to a backend session.
      </div>
    </Card>
  );
}
