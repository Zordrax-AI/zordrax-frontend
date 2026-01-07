"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function OnboardingEntryPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Onboarding</h1>

      <Card>
        <Button
          variant="primary"
          onClick={() => router.push("/portal/onboarding/deploy")}
        >
          Start Deployment
        </Button>
      </Card>
    </div>
  );
}
