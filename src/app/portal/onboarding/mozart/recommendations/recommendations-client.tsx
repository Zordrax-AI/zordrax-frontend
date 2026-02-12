"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RecommendationsClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  function goNext() {
    if (!requirementSetId) return;
    router.push(`/portal/onboarding/mozart/model-kpis?requirement_set_id=${encodeURIComponent(requirementSetId)}`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">AI Top 3 Recommendations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Phase C placeholder. Next: rank 3 architecture options with cost + risk + explanation.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="text-sm text-slate-200">
          Requirement Set: <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>

        <div className="text-sm text-slate-300">Placeholder page wired into the canonical stepper.</div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={goNext} disabled={!requirementSetId}>
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
