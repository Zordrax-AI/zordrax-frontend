"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function GuidedWizard() {
  const router = useRouter();

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Guided onboarding</h2>
        <p className="text-sm text-slate-400">
          Use the new <span className="text-slate-200 font-medium">Mozart</span> wizard for the full BRD lifecycle
          (session → requirement set → submit → approve → plan → infra). Your existing AI/Manual flows remain available.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => router.push("/portal/onboarding/mozart")}>Mozart wizard</Button>

        <Button variant="outline" onClick={() => router.push("/portal/ai")}>
          AI onboarding
        </Button>

        <Button variant="outline" onClick={() => router.push("/portal/manual")}>
          Manual onboarding
        </Button>

        <Button onClick={() => router.push("/portal/onboarding/deploy?rec=test-001")}>
          Continue to Deploy
        </Button>
      </div>
    </Card>
  );
}
