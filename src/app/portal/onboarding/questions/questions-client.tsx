"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function QuestionsClient() {
  const router = useRouter();
  const params = useSearchParams();

  const mode = params.get("mode") ?? "manual";

  // Manual flow state
  const [industry, setIndustry] = useState("");
  const [scale, setScale] = useState("small");
  const [cloud, setCloud] = useState("azure");

  function handleManualNext() {
    const qs = new URLSearchParams({
      mode,
      industry,
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

      <Card className="space-y-4">
        <Field label="Industry">
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Government, Retail, Health…"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Data Scale">
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
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
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="azure">Azure</option>
            <option value="aws">AWS</option>
            <option value="gcp">GCP</option>
          </select>
        </Field>

        <Button variant="primary" onClick={handleManualNext}>
          Generate Recommendation
        </Button>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}
