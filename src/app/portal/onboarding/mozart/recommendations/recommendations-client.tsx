"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RecommendationsClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  function goDeploy() {
    if (!requirementSetId) return;
    router.push(
      `/portal/onboarding/mozart/deploy?requirement_set_id=${encodeURIComponent(requirementSetId)}`
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">AI Top 3 Recommendations</h1>
        <p className="mt-1 text-sm text-slate-400">
          This step is UI-only for now. Backend has no /recommend endpoints yet.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="text-sm text-slate-200">
          Requirement Set:{" "}
          <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>

        {!requirementSetId ? (
          <div className="text-sm text-red-200">
            Missing requirement_set_id in URL. Go back to Connect Data and click Continue.
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-300">
              Next step is Deploy Plan (calls /api/deploy/plan).
            </div>
            <Button onClick={goDeploy}>Continue to Deploy</Button>
          </>
        )}
      </Card>
    </div>
  );
}
