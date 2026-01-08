// C:\Users\Zordr\Desktop\frontend-repo\src\app\portal\onboarding\questions\questions-client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { RecommendMode } from "@/lib/api";

type Errors = { industry?: string };

export default function QuestionsClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<RecommendMode>(
    (params.get("mode") as RecommendMode) ?? "manual"
  );

  const [industry, setIndustry] = useState(params.get("industry") ?? "");
  const [scale, setScale] = useState(params.get("scale") ?? "small");
  const [cloud, setCloud] = useState(params.get("cloud") ?? "azure");

  const [touched, setTouched] = useState(false);

  const errors: Errors = useMemo(() => {
    const e: Errors = {};
    if (!industry.trim()) e.industry = "Industry is required.";
    return e;
  }, [industry]);

  const canContinue = Object.keys(errors).length === 0;

  function handleNext() {
    setTouched(true);
    if (!canContinue) return;

    const qs = new URLSearchParams({
      mode,
      industry: industry.trim(),
      scale,
      cloud,
    });

    router.push(`/portal/onboarding/recommend?${qs.toString()}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboarding Questions</h1>
        <p className="text-sm text-slate-400">
          Configure your platform requirements.
        </p>
      </div>

      {touched && !canContinue ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          Please fix the highlighted fields.
        </div>
      ) : null}

      <Card className="space-y-4">
        <Field label="Recommendation Mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RecommendMode)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          >
            <option value="manual">Manual</option>
            <option value="ai">AI Recommended</option>
          </select>
        </Field>

        <Field label="Industry" error={touched ? errors.industry : undefined}>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Retail, Health, Government…"
            className={[
              "w-full rounded-md border bg-slate-900 px-3 py-2 text-sm outline-none",
              touched && errors.industry
                ? "border-red-600/60 focus:border-red-400"
                : "border-slate-800 focus:border-cyan-400",
            ].join(" ")}
          />
        </Field>

        <Field label="Data Scale">
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </Field>

        <Field label="Preferred Cloud">
          <select
            value={cloud}
            onChange={(e) => setCloud(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          >
            <option value="azure">Azure</option>
            <option value="aws">AWS</option>
            <option value="gcp">GCP</option>
          </select>
        </Field>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Mode: <span className="text-slate-300">{mode}</span>
          </div>

          <Button
            variant="primary"
            onClick={handleNext}
            className={!canContinue ? "opacity-50 pointer-events-none" : ""}
          >
            Generate Recommendation
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
      {error ? <div className="text-xs text-red-300">{error}</div> : null}
    </div>
  );
}
