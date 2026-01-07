"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createRun, executeRun } from "@/lib/api";

export default function DeployPage() {
  const router = useRouter();

  async function handleDeploy() {
    const { run_id } = await createRun(
      "manual",
      "Frontend Triggered Run"
    );

    await executeRun(run_id);

    router.push(`/portal/status?run=${run_id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Deploy Infrastructure</h1>

      <Card>
        <Button variant="primary" onClick={handleDeploy}>
          Deploy Now
        </Button>
      </Card>
    </div>
  );
}
