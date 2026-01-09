"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import {
  recommendStack,
  saveRecommendationSnapshot,
  type RecommendMode,
  type RecommendResponse,
} from "@/lib/api";

/* =========================================================
   API BASE (FRONTEND-SAFE)
   ========================================================= */

const API_BASE =
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

/* =========================================================
   Types
   ========================================================= */

type FormState = {
  mode: RecommendMode;
  industry: string;
  scale: string;
  cloud: string;
};

/* =========================================================
   Component
   ========================================================= */

export default function RecommendClient() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    mode: "manual",
    industry: "",
    scale: "medium",
    cloud: "aws",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);

  /* =========================================================
     Actions
     ========================================================= */

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const rec = await recommendStack(form);
      setResult(rec);

      const snapshotId = crypto.randomUUID();

      await saveRecommendationSnapshot({
        id: snapshotId,
        created_at: new Date().toISOString(),
        ai: rec.source === "ai" ? rec : null,
        final: rec,
        diff: [],
        source_query: form,
      });

      router.push(`/portal/onboarding/deploy?rec=${snapshotId}`);
    } catch (e: any) {
      setError(e?.message ?? "Recommendation failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     Render
     ========================================================= */

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Architecture Recommendation</h1>
        <p className="text-sm text-slate-400">
          Choose manual rules or AI-assisted recommendations.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
          <div className="mt-2 text-xs text-slate-400">
            Backend health check:
            <code className="ml-1">{`GET ${API_BASE}/health`}</code>
          </div>
        </div>
      ) : null}

      <Card>
        <div className="grid gap-4">
          <label className="text-sm">
            Mode
            <select
              className="mt-1 w-full"
              value={form.mode}
              onChange={(e) =>
                setForm({ ...form, mode: e.target.value as RecommendMode })
              }
            >
              <option value="manual">Manual</option>
              <option value="ai">AI</option>
            </select>
          </label>

          <label className="text-sm">
            Industry
            <input
              className="mt-1 w-full"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </label>

          <label className="text-sm">
            Scale
            <select
              className="mt-1 w-full"
              value={form.scale}
              onChange={(e) => setForm({ ...form, scale: e.target.value })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>

          <label className="text-sm">
            Cloud
            <select
              className="mt-1 w-full"
              value={form.cloud}
              onChange={(e) => setForm({ ...form, cloud: e.target.value })}
            >
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
          </label>
        </div>
      </Card>

      <Button
        onClick={submit}
        className={loading ? "opacity-50 pointer-events-none" : ""}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Generating…
          </span>
        ) : (
          "Generate Recommendation"
        )}
      </Button>

      {result ? (
        <Card>
          <h2 className="text-sm font-semibold mb-2">Result</h2>
          <pre className="text-xs bg-black p-3 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
