"use client";

import { useRouter } from "next/navigation";
import { createRun, executeRun } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DeployPage() {
  const router = useRouter();

  async function handleDeploy() {
    try {
      const { run_id } = await createRun(
        "manual",
        "Frontend Triggered Run"
      );

      await executeRun(run_id);

      router.push(`/portal/status?run=${run_id}`);
    } catch (err: any) {
      alert(err?.message || "Deployment failed");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Deploy Infrastructure</h1>
        <p className="mt-1 text-sm text-slate-400">
          This will provision infrastructure using the approved configuration.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Execution</h2>
            <p className="text-xs text-slate-400">
              Terraform init → plan → apply
            </p>
          </div>

          <Button variant="primary" onClick={handleDeploy}>
            Deploy Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
