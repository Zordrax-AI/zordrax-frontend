"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { deployStack } from "@/lib/api";

type Recommendation = {
  cloud: string;
  region?: string;
  env?: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
};

export default function DeployClient() {
  const router = useRouter();
  const params = useSearchParams();

  const recId = params.get("rec");

  const [error, setError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  // 🚨 IMPORTANT:
  // We are NOT Zod-parsing anything here.
  // Deploy page assumes recommendation already exists.
  // Validation belongs on the backend.
  async function handleDeploy() {
    if (!recId) {
      setError("Missing recommendation id");
      return;
    }

    setError(null);
    setDeploying(true);

    try {
      const res = await deployStack({
        recommendation_id: recId,
      });

      router.push(`/portal/onboarding/status?run=${res.run_id}`);
    } catch (e: any) {
      setError(e.message ?? "Deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-2">Deploy Stack</h2>

      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}

      <Button onClick={handleDeploy} disabled={deploying}>
        {deploying ? "Deploying..." : "Deploy"}
      </Button>
    </Card>
  );
}
