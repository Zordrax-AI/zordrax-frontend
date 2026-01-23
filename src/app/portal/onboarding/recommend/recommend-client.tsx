"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  recommendStack,
  type RecommendRequest,
  type ArchitectureRecommendation,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RecommendClient() {
  const params = useSearchParams();

  const mode = (params.get("mode") || "ai") as "manual" | "ai";
  const industry = params.get("industry") || "Health";
  const scale = (params.get("scale") || "small") as "small" | "medium" | "large";
  const cloud = (params.get("cloud") || "azure") as "azure" | "aws" | "gcp";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<ArchitectureRecommendation | null>(null);

  const req: RecommendRequest = useMemo(
    () => ({ mode, industry, scale, cloud }),
    [mode, industry, scale, cloud]
  );

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const r = await recommendStack(req);
      setRec(r);
    } catch (e: any) {
      setError(e?.message ?? "AI recommend is not live yet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="text-lg font-semibold">AI Recommendation</div>

        {error && (
          <div className="rounded border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="text-sm text-slate-300">
          Mode: <span className="font-mono">{mode}</span> • Industry:{" "}
          <span className="font-mono">{industry}</span> • Scale:{" "}
          <span className="font-mono">{scale}</span> • Cloud:{" "}
          <span className="font-mono">{cloud}</span>
        </div>

        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Working..." : "Generate Recommendation"}
        </Button>
      </Card>

      {rec && (
        <Card>
          <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">
            {JSON.stringify(rec, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
