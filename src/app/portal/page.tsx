import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

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
            <LinkButton href="/portal/onboarding" variant="primary">
              Open Onboarding
            </LinkButton>
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
            <LinkButton href="/portal/runs" variant="outline">
              View Runs
            </LinkButton>
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
            <LinkButton href="/portal/diagnostics" variant="outline">
              Open Diagnostics
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
