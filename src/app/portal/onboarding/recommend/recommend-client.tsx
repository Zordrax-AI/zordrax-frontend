"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import {
  recommendStack,
  saveRecommendationSnapshot,
  type RecommendRequest,
  type ArchitectureRecommendation,
  type RecommendationSnapshotCreate,
} from "@/lib/api";

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState<RecommendRequest>({
    mode: (params.get("mode") as "manual" | "ai") ?? "ai",
    industry: params.get("industry") ?? "",
    scale: (params.get("scale") as any) ?? "small",
    cloud: (params.get("cloud") as any) ?? "azure",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecommend() {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Get recommendation (typed, UI model)
      const rec: ArchitectureRecommendation = await recommendStack(form);

      // 2️⃣ Convert to OPAQUE JSON for SSOT persistence
      const opaque = rec as unknown as Record<string, never>;

      const snapshot: RecommendationSnapshotCreate = {
        final: opaque,
        ai: rec.source === "ai" ? opaque : null,
        diff: [],
        source_query: form as unknown as Record<string, never>,
      };

      // 3️⃣ Persist immutable snapshot
      const saved = await saveRecommendationSnapshot(snapshot);

      // 4️⃣ Move to deploy step
      router.push(`/portal/onboarding/deploy?rec=${saved.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate recommendation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold">AI Recommendation</h2>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm"
          placeholder="Industry (e.g. FinTech)"
          value={form.industry}
          onChange={(e) =>
            setForm({ ...form, industry: e.target.value })
          }
        />
      </div>

      <Button onClick={handleRecommend} disabled={loading}>
        {loading ? "Thinking..." : "Generate Recommendation"}
      </Button>
    </Card>
  );
}
