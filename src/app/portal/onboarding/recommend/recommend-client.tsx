// src/app/portal/onboarding/recommend/recommend-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Recommendation = {
  cloud: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
  region: string;
  env: string;
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

function safeGet(params: URLSearchParams, key: string, fallback: string) {
  const v = params.get(key);
  return (v && v.trim()) || fallback;
}

/**
 * Frontend-only “AI” baseline generator.
 * Deterministic: same inputs → same recommendation.
 */
function buildAiRecommendation(params: URLSearchParams): Recommendation {
  const mode = safeGet(params, "mode", "manual").toLowerCase();
  const industry = safeGet(params, "industry", "general").toLowerCase();
  const scale = safeGet(params, "scale", "small").toLowerCase();
  const cloud = safeGet(params, "cloud", "azure").toLowerCase();

  const region =
    cloud === "azure"
      ? "uksouth"
      : cloud === "aws"
      ? "eu-west-2"
      : "europe-west2";

  const env = mode === "ai" ? "prod" : "dev";

  // Slightly “smarter” defaults based on scale + cloud
  let warehouse = "Databricks";
  let etl = "dbt";
  let bi = cloud === "azure" ? "Power BI" : "Looker";
  let governance = cloud === "azure" ? "Purview" : "OpenMetadata";

  if (cloud === "aws") {
    warehouse = scale === "large" ? "Redshift" : "Snowflake";
    etl = "dbt";
    bi = "QuickSight";
    governance = "OpenMetadata";
  }

  if (cloud === "gcp") {
    warehouse = scale === "large" ? "BigQuery" : "BigQuery";
    etl = "dbt";
    bi = "Looker";
    governance = "Dataplex";
  }

  // Industry nudge (still safe, not hard-coded)
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

function computeDiff(ai: Recommendation, draft: Recommendation): DiffItem[] {
  return FIELDS.map(({ key, label }) => {
    const before = String(ai[key] ?? "");
    const after = String(draft[key] ?? "");
    return {
      key,
      label,
      before,
      after,
      changed: before !== after,
    };
  });
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const ai = useMemo(() => buildAiRecommendation(params), [params]);

  const [draft, setDraft] = useState<Recommendation>(ai);
  const [approvedId, setApprovedId] = useState<string | null>(null);

  // Reset draft when query params change (rare but correct)
  useEffect(() => {
    setDraft(ai);
    setApprovedId(null);
  }, [ai]);

  const diff = useMemo(() => computeDiff(ai, draft), [ai, draft]);
  const changedCount = diff.filter((d) => d.changed).length;

  function setField<K extends keyof Recommendation>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setApprovedId(null);
  }

  function resetToAi() {
    setDraft(ai);
    setApprovedId(null);
  }

  function approveAndContinue() {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const payload = {
      id,
      created_at: new Date().toISOString(),
      ai_snapshot: ai,
      final: draft,
      diff: computeDiff(ai, draft),
      source_query: Object.fromEntries(params.entries()),
    };

    try {
      sessionStorage.setItem(`zordrax:rec:${id}`, JSON.stringify(payload));
    } catch (e) {
      // If sessionStorage is blocked, still proceed without persistence
      // but user loses continuity on refresh.
      console.warn("sessionStorage unavailable", e);
    }

    setApprovedId(id);
    router.push(`/portal/onboarding/deploy?rec=${encodeURIComponent(id)}`);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recommendation Review</h1>
          <p className="mt-1 text-sm text-slate-400">
            Compare the AI baseline vs your final edits. This is frontend-only
            (no backend persistence yet).
          </p>
          {approvedId ? (
            <p className="mt-2 text-xs text-slate-500">
              Saved snapshot: <span className="font-mono">{shortId(approvedId)}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-slate-400">
            Changes:{" "}
            <span className={changedCount ? "text-amber-300" : "text-emerald-300"}>
              {changedCount}
            </span>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: Editable final */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Final (Editable)</h2>
            <p className="mt-1 text-xs text-slate-400">
              Adjust any field. The diff updates live.
            </p>
          </div>

          <div className="space-y-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-3 items-center gap-3">
                <div className="text-xs text-slate-400">{label}</div>
                <input
                  value={draft[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="col-span-2 w-full rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT: Diff view */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Diff (AI → Final)</h2>
            <p className="mt-1 text-xs text-slate-400">
              Green = unchanged, Amber = overridden.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-900 text-left text-xs text-slate-400">
                  <th className="py-2 pr-3">Field</th>
                  <th className="py-2 pr-3">AI</th>
                  <th className="py-2 pr-3">Final</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((d) => (
                  <tr key={d.key} className="border-b border-slate-950">
                    <td className="py-2 pr-3 text-slate-300">{d.label}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-400">
                      {d.before}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-200">
                      {d.after}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          d.changed
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        }`}
                      >
                        {d.changed ? "overridden" : "unchanged"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">Snapshot behavior (C.3.1)</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Baseline AI recommendation is computed client-side.</li>
              <li>Your edits are compared live via this diff.</li>
              <li>On Approve: snapshot is saved in <span className="font-mono">sessionStorage</span>.</li>
              <li>Next: Deploy reads the snapshot using <span className="font-mono">?rec=&lt;id&gt;</span>.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
