"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { deployPlan } from "@/lib/api";

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();

  const recId = params.get("rec");

  const [error, setError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  async function handleDeploy() {
    if (!recId) {
      setError("Missing recommendation id");
      return;
    }

    setError(null);
    setDeploying(true);

    try {
      // SSOT-compliant deploy plan
      const res = await deployPlan({
        recommendation_id: recId,
      });

      // Move to approval / status screen
      router.push(`/portal/status?run=${res.run_id}`);
    } catch (e: any) {
      setError(e?.message ?? "Deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold">Deploy Stack</h2>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      <Button onClick={handleDeploy} disabled={deploying}>
        {deploying ? "Planning…" : "Generate Terraform Plan"}
      </Button>
    </Card>
  );
}
