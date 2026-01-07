import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PortalHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Zordrax-Analytica Console</h1>
        <p className="mt-1 text-sm text-slate-400">
          Orchestrate Infra → ETL → Governance → BI with AI-augmented onboarding.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Onboarding */}
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Start Onboarding
            </h2>
            <p className="text-xs text-slate-400">
              AI-driven guided onboarding flow.
            </p>

            <Link href="/portal/onboarding">
              <Button variant="primary" className="w-full">
                Open Onboarding
              </Button>
            </Link>
          </div>
        </Card>

        {/* Runs */}
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Deployments
            </h2>
            <p className="text-xs text-slate-400">
              Terraform & pipeline execution history.
            </p>

            <Link href="/portal/runs">
              <Button variant="outline" className="w-full">
                View Runs
              </Button>
            </Link>
          </div>
        </Card>

        {/* Diagnostics */}
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Environment & backend connectivity checks.
            </p>

            <Link href="/portal/diagnostics">
              <Button variant="outline" className="w-full">
                Open Diagnostics
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
