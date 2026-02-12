"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

export default function RecommendationsClient() {
  const sp = useSearchParams();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">AI Top 3 Recommendations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Next (Phase C): rank 3 architecture options with cost + risk + explanation.
        </p>
      </div>

      <Card className="p-4">
        <div className="text-sm text-slate-200">
          Requirement Set: <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>
        <div className="mt-3 text-sm text-slate-300">Placeholder page wired into the canonical stepper.</div>
      </Card>
    </div>
  );
}
