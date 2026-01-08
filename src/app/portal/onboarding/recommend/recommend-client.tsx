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

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const rawMode = params.get("mode");
  const mode: RecommendMode = rawMode === "ai" ? "ai" : "manual";

  const industry = params.get("industry") ?? "general";
  const scale = params.get("scale") ?? "small";
  const cloud = params.get("cloud") ?? "azure";

  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState<Recommendation | null>(null);
  const [draft, setDraft] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          cloud: rec.cloud,
          region: rec.region,
          env: rec.env,
          warehouse: rec.warehouse,
          etl: rec.etl,
          bi: rec.bi,
          governance: rec.governance,
        };

        if (!alive) return;
        setAi(normalized);
        setDraft(normalized);
      } catch (e: any) {
        if (!alive) return;
        setError(e.message || "Failed to generate recommendation");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [mode, industry, scale, cloud]);

  const diff = useMemo(
    () => (ai && draft ? computeDiff(ai, draft) : []),
    [ai, draft]
  );

  async function approveAndContinue() {
    if (!ai || !draft) return;

    const id = crypto.randomUUID();

    await saveRecommendationSnapshot({
      id,
      ai,
      final: draft,
      diff,
      source_query: Object.fromEntries(params.entries()),
    });

    router.push(`/portal/onboarding/deploy?rec=${id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Spinner /> Generating recommendation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="max-w-6xl space-y-6">
      <Card>
        <pre className="rounded bg-black p-3 text-xs">
          {JSON.stringify(draft, null, 2)}
        </pre>
      </Card>

      <Button variant="primary" onClick={approveAndContinue}>
        Approve & Continue
      </Button>
    </div>
  );
}
