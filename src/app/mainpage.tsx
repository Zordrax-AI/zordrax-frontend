import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function MainPage() {
  return (
    <main className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Zordrax-Analytica</h1>
        <p className="max-w-2xl text-slate-400">
          AI-augmented analytics platform for infrastructure, data pipelines,
          governance, and business intelligence.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Portal</h2>
            <p className="text-xs text-slate-400">
              Access the orchestration console.
            </p>

            <Link href="/portal">
              <Button variant="primary" className="w-full">
                Open Portal
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Onboarding</h2>
            <p className="text-xs text-slate-400">
              Guided AI-assisted setup.
            </p>

            <Link href="/portal/onboarding">
              <Button variant="outline" className="w-full">
                Start Onboarding
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Runs</h2>
            <p className="text-xs text-slate-400">
              View Terraform & pipeline executions.
            </p>

            <Link href="/portal/runs">
              <Button variant="outline" className="w-full">
                View Runs
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
