"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/* =========================
   Types
========================= */

type Recommendation = {
  cloud: string;
  region: string;
  env: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
};

type DiffItem = {
  key: keyof Recommendation;
  label: string;
  before: string;
  after: string;
  changed: boolean;
};

const FIELDS: Array<{ key: keyof Recommendation; label: string }> = [
  { key: "cloud", label: "Cloud" },
  { key: "region", label: "Region" },
  { key: "env", label: "Environment" },
  { key: "warehouse", label: "Warehouse" },
  { key: "etl", label: "ETL" },
  { key: "bi", label: "BI" },
  { key: "governance", label: "Governance" },
];

/* =========================
   Helpers
========================= */

function safeGet(params: URLSearchParams, key: string, fallback: string) {
  const v = params.get(key);
  return v && v.trim() ? v : fallback;
}

function buildAiRecommendation(params: URLSearchParams): Recommendation {
  const mode = safeGet(params, "mode", "manual");
  const industry = safeGet(params, "industry", "general");
  const scale = safeGet(params, "scale", "small");
  const cloud = safeGet(params, "cloud", "azure");

  const region =
    cloud === "azure"
      ? "uksouth"
      : cloud === "aws"
      ? "eu-west-2"
      : "europe-west2";

  const env = mode === "ai" ? "prod" : "dev";

  let warehouse = "Databricks";
  let etl = "dbt";
  let bi = cloud === "azure" ? "Power BI" : "Looker";
  let governance = cloud === "azure" ? "Purview" : "OpenMetadata";

  if (cloud === "aws") {
    warehouse = scale === "large" ? "Redshift" : "Snowflake";
    bi = "QuickSight";
    governance = "OpenMetadata";
  }

  if (cloud === "gcp") {
    warehouse = "BigQuery";
    bi = "Looker";
    governance = "Dataplex";
  }

  if (industry.includes("health") || industry.includes("gov")) {
    governance = cloud === "azure" ? "Purview" : governance;
  }

  return {
    cloud,
    region,
    env,
    warehouse,
    etl,
    bi,
    governance,
  };
}

function computeDiff(ai: Recommendation, final: Recommendation): DiffItem[] {
  return FIELDS.map(({ key, label }) => ({
    key,
    label,
    before: String(ai[key]),
    after: String(final[key]),
    changed: ai[key] !== final[key],
  }));
}

/* =========================
   Component
========================= */

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const ai = useMemo(() => buildAiRecommendation(params), [params]);

  const [draft, setDraft] = useState<Recommendation>(ai);

  useEffect(() => {
    setDraft(ai);
  }, [ai]);

  const diff = useMemo(() => computeDiff(ai, draft), [ai, draft]);
  const changedCount = diff.filter((d) => d.changed).length;

  function setField<K extends keyof Recommendation>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetToAi() {
    setDraft(ai);
  }

  function approveAndContinue() {
    const id = crypto.randomUUID();

    const snapshot = {
      id,
      created_at: new Date().toISOString(),
      ai,
      final: draft,
      diff,
      source_query: Object.fromEntries(params.entries()),
    };

    sessionStorage.setItem(`zordrax:rec:${id}`, JSON.stringify(snapshot));

    router.push(`/portal/onboarding/deploy?rec=${encodeURIComponent(id)}`);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recommendation Review</h1>
          <p className="text-sm text-slate-400">
            AI baseline vs your final configuration.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/portal/onboarding/questions")}>
            Back
          </Button>
          <Button variant="outline" onClick={resetToAi}>
            Reset to AI
          </Button>
          <Button variant="primary" onClick={approveAndContinue}>
            Approve & Continue
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editable */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Final Configuration</h2>

          {FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 gap-3 items-center">
              <div className="text-xs text-slate-400">{label}</div>
              <input
                value={draft[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="col-span-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </Card>

        {/* Diff */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">
            Diff (AI → Final) · {changedCount} change(s)
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="py-2">Field</th>
                <th>AI</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={d.key} className="border-b border-slate-900">
                  <td className="py-2">{d.label}</td>
                  <td className="font-mono text-xs text-slate-400">{d.before}</td>
                  <td
                    className={`font-mono text-xs ${
                      d.changed ? "text-amber-300" : "text-emerald-300"
                    }`}
                  >
                    {d.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
