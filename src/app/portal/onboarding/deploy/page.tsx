"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Deploy Infrastructure</h1>

      <Button variant="primary" onClick={handleDeploy}>
        Deploy Now
      </Button>
    </div>
  );
}
