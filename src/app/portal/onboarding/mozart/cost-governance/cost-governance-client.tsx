"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CostGovernanceClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  function goNext() {
    if (!requirementSetId) return;
    router.push(`/portal/onboarding/mozart/deploy?requirement_set_id=${encodeURIComponent(requirementSetId)}`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Cost + Governance</h1>
        <p className="mt-1 text-sm text-slate-400">
          Phase E placeholder. Next: cost breakdown + governance posture + confidence scoring.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="text-sm text-slate-200">
          Requirement Set: <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>

        <div className="text-sm text-slate-300">Placeholder step wired into the canonical flow.</div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={goNext} disabled={!requirementSetId}>
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
