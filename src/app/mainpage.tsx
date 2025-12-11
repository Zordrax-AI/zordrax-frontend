import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";

export default function MainPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Zordrax-Analytica Console</h1>
        <p className="text-sm text-slate-400 mt-1">
          Orchestrate Infra → ETL → Governance → BI with AI-augmented onboarding.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Onboarding */}
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Start Onboarding</h2>
            <p className="text-xs text-slate-400">
              Use AI, guided wizard, or visual designer.
            </p>
            <LinkButton href="/onboarding" variant="primary">
              Open Onboarding
            </LinkButton>
          </div>
        </Card>

        {/* Sessions */}
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Sessions</h2>
            <p className="text-xs text-slate-400">View saved onboarding sessions.</p>
            <LinkButton href="/sessions" variant="outline">
              View Sessions
            </LinkButton>
          </div>
        </Card>

        {/* Runs */}
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Deployments</h2>
            <p className="text-xs text-slate-400">Terraform & pipeline history.</p>
            <LinkButton href="/runs" variant="outline">
              View Runs
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
