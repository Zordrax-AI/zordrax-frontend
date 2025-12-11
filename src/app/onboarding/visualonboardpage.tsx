"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { aiRecommendStack } from "@/lib/api";

type Mode = "ai" | "guided" | "visual";

export default function OnboardingVisualPage() {
  const [mode, setMode] = useState<Mode>("ai");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Onboarding Console</h1>
      <p className="text-sm text-slate-400">Choose your onboarding mode.</p>

      <div className="flex gap-2 text-xs">
        {["ai", "guided", "visual"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as Mode)}
            className={`px-3 py-1 rounded-full ${
              mode === m
                ? "bg-sky-500 text-black font-medium"
                : "bg-slate-900 text-slate-300"
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {mode === "ai" && <AiMode />}
      {mode === "guided" && <GuidedMode />}
      {mode === "visual" && <VisualMode />}
    </div>
  );
}

/* ------------------- AI MODE ------------------- */
function AiMode() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await aiRecommendStack({ goal });
      setSummary(res.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">AI Stack Recommendation</h2>
        <Badge tone="success">AI Mode</Badge>
      </div>

      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Describe your project goal..."
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        rows={3}
      />

      <Button onClick={onSubmit} disabled={!goal || loading}>
        {loading ? <Spinner /> : "Generate"}
      </Button>

      {error && <p className="text-rose-400 text-xs">{error}</p>}

      {summary && (
        <pre className="text-xs bg-slate-900 rounded-xl p-3 border border-slate-700 whitespace-pre-wrap">
          {summary}
        </pre>
      )}
    </Card>
  );
}

/* ------------------- GUIDED MODE ------------------- */
function GuidedMode() {
  return (
    <Card>
      <h2 className="text-sm font-semibold">Guided Builder</h2>
      <p className="text-xs text-slate-400 mt-1">Multi-step wizard coming next.</p>
    </Card>
  );
}

/* ------------------- VISUAL MODE ------------------- */
function VisualMode() {
  return (
    <Card>
      <h2 className="text-sm font-semibold">Visual Designer</h2>
      <p className="text-xs text-slate-400 mt-1">
        Drag-and-drop ETL designer coming next.
      </p>
    </Card>
  );
}
