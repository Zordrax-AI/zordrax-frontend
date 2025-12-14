// src/app/portal/page.tsx
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function PortalHome() {
  return (
    <div className="max-w-4xl mx-auto py-16 space-y-8">
      <h1 className="text-3xl font-bold">Zordrax Analytica Portal</h1>
      <p className="text-slate-400">
        Configure, deploy, and monitor your data platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">🚀 Start Onboarding</h2>
          <p className="text-sm text-slate-400 mt-2">
            Guided or visual onboarding to deploy your stack.
          </p>
          <Link
            href="/portal/onboarding"
            className="inline-block mt-4 text-sky-400"
          >
            Go →
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">📊 View Runs</h2>
          <p className="text-sm text-slate-400 mt-2">
            Monitor pipeline executions and logs.
          </p>
          <Link
            href="/portal/runs"
            className="inline-block mt-4 text-sky-400"
          >
            View →
          </Link>
        </Card>
      </div>
    </div>
  );
}
