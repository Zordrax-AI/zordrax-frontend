"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  recommendStack,
  saveRecommendationSnapshot,
  type RecommendMode,
} from "@/lib/api";

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

/* =========================
   Constants
========================= */

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

function normalizeMode(v: string | null | undefined): RecommendMode {
  return v === "ai" ? "ai" : "manual";
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

function defaultRegion(cloud: string) {
  return cloud === "azure" ? "uksouth" : cloud === "aws" ? "eu-west-2" : "europe-west2";
}

function fallbackFromQuery(params: URLSearchParams): Recommendation {
  const cloud = params.get("cloud") ?? "azure";
  const mode = normalizeMode(params.get("mode"));

  return {
    cloud,
    region: defaultRegion(cloud),
    env: mode === "ai" ? "prod" : "dev",
    warehouse: "Databricks",
    etl: "dbt",
    bi: cloud === "azure" ? "Power BI" : "Looker",
    governance: cloud === "azure" ? "Purview" : "OpenMetadata",
  };
}

/* =========================
   Component
========================= */

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const mode: RecommendMode = normalizeMode(params.get("mode"));
  const industry = params.get("industry") ?? "general";
  const scale = params.get("scale") ?? "small";
  const cloud = params.get("cloud") ?? "azure";

  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState<Recommendation>(() => fallbackFromQuery(params));
  const [draft, setDraft] = useState<Recommendation>(() => fallbackFromQuery(params));
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Load AI recommendation
  ========================= */

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const rec = await recommendStack({
          mode,
          industry,
          scale,
          cloud,
        });

        const normalized: Recommendation = {
          cloud: rec?.cloud ?? cloud,
          region: rec?.region ?? defaultRegion(rec?.cloud ?? cloud),
          env: rec?.env ?? (mode === "ai" ? "prod" : "dev"),
          warehouse: rec?.warehouse ?? rec?.data_warehouse ?? "Databricks",
          etl: rec?.etl ?? rec?.transformation ?? "dbt",
          bi: rec?.bi ?? rec?.reporting ?? (cloud === "azure" ? "Power BI" : "Looker"),
          governance: rec?.governance ?? (cloud === "azure" ? "Purview" : "OpenMetadata"),
        };

        if (!alive) return;
        setAi(normalized);
        setDraft(normalized);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to generate recommendation");

        const fb = fallbackFromQuery(params);
        setAi(fb);
        setDraft(fb);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [mode, industry, scale, cloud, params]);

  /* =========================
     Diff
  ========================= */

  const diff = useMemo(() => computeDiff(ai, draft), [ai, draft]);
  const changedCount = diff.filter((d) => d.changed).length;

  function setField<K extends keyof Recommendation>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetToAi() {
    setDraft(ai);
  }

  /* =========================
     APPROVE (single source)
  ========================= */

  async function approveAndContinue() {
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

    try {
      await saveRecommendationSnapshot({
        id,
        ai,
        final: draft,
        diff,
        source_query: Object.fromEntries(params.entries()),
      });
    } catch (e) {
      console.warn("Snapshot backend save failed", e);
    }

    router.push(`/portal/onboarding/deploy?rec=${encodeURIComponent(id)}`);
  }

  /* =========================
     Render
  ========================= */

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recommendation Review</h1>
          <p className="text-sm text-slate-400">AI recommendation with live diff & audit snapshot.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/portal/onboarding/questions?mode=${encodeURIComponent(mode)}&industry=${encodeURIComponent(
                  industry
                )}&scale=${encodeURIComponent(scale)}&cloud=${encodeURIComponent(cloud)}`
              )
            }
          >
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

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner /> Generating recommendation…
        </div>
      )}

      {error && (
        <div className="rounded-md border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Final (Editable)</h2>
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 gap-3 items-center">
              <div className="text-xs text-slate-400">{label}</div>
              <input
                value={draft[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="col-span-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              />
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Diff (AI → Final) · {changedCount} change(s)</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-800">
                <th className="py-2 text-left">Field</th>
                <th className="text-left">AI</th>
                <th className="text-left">Final</th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={d.key} className="border-b border-slate-900">
                  <td className="py-2">{d.label}</td>
                  <td className="font-mono text-xs text-slate-400">{d.before}</td>
                  <td className={`font-mono text-xs ${d.changed ? "text-amber-300" : "text-emerald-300"}`}>
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
