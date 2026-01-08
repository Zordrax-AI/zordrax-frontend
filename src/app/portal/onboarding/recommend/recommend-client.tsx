// C:\Users\Zordr\Desktop\frontend-repo\src\app\portal\onboarding\recommend\recommend-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  recommendStack,
  saveRecommendationSnapshot,
  pingBackend,
  type RecommendMode,
  type RecommendResponse,
} from "@/lib/api";

/* =========================
   UI Types
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

function computeDiff(ai: Recommendation, final: Recommendation): DiffItem[] {
  return FIELDS.map(({ key, label }) => ({
    key,
    label,
    before: String(ai[key]),
    after: String(final[key]),
    changed: ai[key] !== final[key],
  }));
}

function normalize(rec: RecommendResponse): Recommendation {
  return {
    cloud: rec.cloud,
    region: rec.region,
    env: rec.env,
    warehouse: rec.warehouse,
    etl: rec.etl,
    bi: rec.bi,
    governance: rec.governance,
  };
}

function fallbackFromQuery(params: URLSearchParams): Recommendation {
  const cloud = params.get("cloud") ?? "azure";
  const region =
    cloud === "azure" ? "uksouth" : cloud === "aws" ? "eu-west-2" : "europe-west2";

  const mode = (params.get("mode") as RecommendMode) ?? "manual";
  const env = mode === "ai" ? "prod" : "dev";

  return {
    cloud,
    region,
    env,
    warehouse: "Databricks",
    etl: "dbt",
    bi: cloud === "azure" ? "Power BI" : "Looker",
    governance: cloud === "azure" ? "Purview" : "OpenMetadata",
  };
}

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const mode = ((params.get("mode") as RecommendMode) ?? "manual") as RecommendMode;
  const industry = params.get("industry") ?? "general";
  const scale = params.get("scale") ?? "small";
  const cloud = params.get("cloud") ?? "azure";

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [ai, setAi] = useState<Recommendation>(() => fallbackFromQuery(params));
  const [draft, setDraft] = useState<Recommendation>(() => fallbackFromQuery(params));

  const diff = useMemo(() => computeDiff(ai, draft), [ai, draft]);
  const changedCount = diff.filter((d) => d.changed).length;

  function setField<K extends keyof Recommendation>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetToAi() {
    setDraft(ai);
  }

  async function loadRecommendation() {
    setLoading(true);
    setError(null);

    try {
      // Sanity check: proves BASE URL is reachable from browser
      await pingBackend();

      const rec = await recommendStack({
        mode,
        industry,
        scale,
        cloud,
      });

      const normalized = normalize(rec);
      setAi(normalized);
      setDraft(normalized);
    } catch (e: any) {
      const msg = e?.message || "Failed to load recommendation.";
      setError(msg);
      const fb = fallbackFromQuery(params);
      setAi(fb);
      setDraft(fb);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await loadRecommendation();
    })();

    return () => {
      alive = false;
    };
    // attempt is included for manual retry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, industry, scale, cloud, attempt]);

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

    // local continuity
    sessionStorage.setItem(`zordrax:rec:${id}`, JSON.stringify(snapshot));

    // backend persistence (don’t block UX)
    try {
      await saveRecommendationSnapshot(snapshot);
    } catch (e) {
      console.warn("Snapshot save failed:", e);
    }

    router.push(`/portal/onboarding/deploy?rec=${encodeURIComponent(id)}`);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recommendation Review</h1>
          <p className="text-sm text-slate-400">
            Mode: <span className="text-slate-200">{mode}</span> · Industry:{" "}
            <span className="text-slate-200">{industry}</span> · Scale:{" "}
            <span className="text-slate-200">{scale}</span> · Cloud:{" "}
            <span className="text-slate-200">{cloud}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/portal/onboarding/questions?${new URLSearchParams({
              mode,
              industry,
              scale,
              cloud,
            }).toString()}`)}
          >
            Back
          </Button>

          <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </Button>

          <Button variant="outline" onClick={resetToAi}>
            Reset to AI
          </Button>

          <Button
            variant="primary"
            onClick={approveAndContinue}
            className={loading ? "opacity-50 pointer-events-none" : ""}
          >
            Approve & Continue
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner /> Loading recommendation…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          <div className="font-semibold mb-1">Recommendation error</div>
          <div className="whitespace-pre-wrap">{error}</div>
          <div className="mt-2 text-xs text-slate-400">
            If you see <code>{`{"detail":"Not Found"}`}</code>, your frontend is hitting the wrong base URL or wrong route.
            Confirm the API base is reachable from the browser: <code>{`GET ${BASE}/health`}</code>.
          </div>
        </div>
      ) : null}

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
          <h2 className="text-sm font-semibold">
            Diff (AI → Final) · {changedCount} change(s)
          </h2>
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
