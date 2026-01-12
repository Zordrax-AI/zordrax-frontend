"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import {
  recommendStack,
  saveRecommendationSnapshot,
  type ArchitectureRecommendation,
  type RecommendRequest,
  type RecommendationSnapshotCreate,
} from "@/lib/api";

export default function RecommendClient() {
  const router = useRouter();

  const [form, setForm] = useState<RecommendRequest>({
    mode: "ai",
    industry: "",
    scale: "small",
    cloud: "azure",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecommend() {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Get AI recommendation (strict SSOT output)
      const rec: ArchitectureRecommendation = await recommendStack(form);

      // 2️⃣ Persist snapshot as OPAQUE JSON (backend-defined)
      const snapshot: RecommendationSnapshotCreate = {
        final: rec as unknown as Record<string, never>,
        ai:
          rec.source === "ai"
            ? (rec as unknown as Record<string, never>)
            : null,
        diff: [],
        source_query: form as unknown as Record<string, never>,
      };

      // 3️⃣ Persist snapshot
      const saved = await saveRecommendationSnapshot(snapshot);

      // 4️⃣ Move forward with snapshot id
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
        {loading ? "Thinking…" : "Generate Recommendation"}
      </Button>
    </Card>
  );
}
